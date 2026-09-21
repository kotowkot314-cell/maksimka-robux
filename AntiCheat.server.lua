--[[
    KotowAC v1.0.0 — серверный античит для Roblox.
    
    Установка:
      ServerScriptService/
        └── KotowAC (Script)  ← этот файл
    
    В Studio не работает (IsStudio), тестировать только на опубликованной игре.
    
    API:
      K.Run()                          — запустить ядро. Идемпотентно.
      K.Stop()                         — остановить ядро. Идемпотентно.
      K.AddDetect(name, fn, prio, cd)  — добавить кастомный детект.
      K.AddPunish(name, fn)            — добавить кастомное наказание.
      K.RegisterPlugin(name, mod)      — зарегистрировать плагин.
      K.Punish(pl, reason)             — выдать варн игроку.
      K.Kick(pl, txt)                  — кикнуть игрока.
      K.IsBodyMover(d)                 — проверить, BodyMover ли объект.
      K.State(uid)                     — получить состояние игрока.
      K.Cfg                            — таблица настроек.
      K.Msgs                           — таблица сообщений.
    
    Что ловит:
      speed, fly, freefall, body, tp, jump, jumpmove, pos_jump, up, airmove, noclip_honeypot, ws.
    
    Интеграция:
      Спринт:  hum:SetAttribute("legitSpeed", 22) при включении, 16 при выключении.
      Машины:  pl:SetAttribute("inCar", true) при посадке, false при выходе.
      Клиент:  RemoteEvent "ACAlert" в ReplicatedStorage → OnClientEvent(name, reason, warns)
    
    Пример кастомного детекта:
      K.AddDetect("MyDetect", function(pl, s)
          if s.myCounter and s.myCounter > 5 then return true end
          return false
      end, 100, 0)
]]

local plrs = game:GetService("Players")
local dss = game:GetService("DataStoreService")
local rs = game:GetService("RunService")
local rs2 = game:GetService("ReplicatedStorage")
local http = game:GetService("HttpService")

if rs:IsStudio() then return end

local K = {}

K.Version = "1.0.0"
K.Name = "KotowAC"
K.Running = false

K.Cfg = {
	L = 4,
	MS = 80,
	JR = 2,
	BT = 3600,
	WR = 1800,
	EL = 2,
	RT = 3600,
	SL = 30,
	SW = 5,
	MJ = 7,
	UC = 5,
	UW = 3,
	TP = 50,
	TPC = 2,
	GRACE = 5,
	PCD = 2,
	FREE_MOVE_LIM = 2,
	HP_SAFE = 30,
}

K.Msgs = {
	fly = {
		"kuda letish XD",
		"ne letay :P",
		"zemlya zhdet",
		"ty prizrak? :P",
		"chiter detected XD",
	},
	ban = {
		"poluchay ban, chiter XD",
		"otdohny chasok :P",
		"ban na chas, dumay",
	},
}

K.S = {}
K.Detects = {}
K.DetectsSorted = {}
K.DetectsDirty = false
K.Punishes = {}
K.Plugins = {}
K.Connections = {}
K.Dead = false
K.DsDead = false
K.Dt = nil
K.HP = nil
K.Acc = 0
K.Bans = nil
K.Alert = nil

function K.Init()
	K.Bans = dss:GetDataStore("KotowAC_Bans_v1")

	K.Alert = rs2:FindFirstChild("ACAlert")
	if not K.Alert then
		K.Alert = Instance.new("RemoteEvent")
		K.Alert.Name = "ACAlert"
		K.Alert.Parent = rs2
	end

	print("[KotowAC] v" .. K.Version .. " init")
end

function K.State(uid)
	local s = K.S[uid]
	if not s then
		s = {
			fly = 0, spd = 0, jmp = 0, lj = 0,
			jumped = false, jumpedAt = 0, lastJumpY = nil,
			upCount = 0, upLastY = 0, upStart = 0,
			lastPos = nil, tpCount = 0,
			grace = 0, freeTime = 0, freeMove = 0,
			lastPunish = 0, wrn = 0, err = {},
			js = {n = 0, t = 0}, jsp = {n = 0, t = 0},
			ch = nil, hum = nil, hrp = nil, pl = nil,
			detectCooldown = {},
			conns = {},
		}
		K.S[uid] = s
	end
	return s
end

function K.IsBodyMover(d)
	return d:IsA("BodyVelocity")
		or d:IsA("BodyGyro")
		or d:IsA("BodyAngularVelocity")
		or d:IsA("BodyPosition")
		or d:IsA("BodyThrust")
		or d:IsA("BodyForce")
		or d:IsA("LinearVelocity")
		or d:IsA("AngularVelocity")
		or d:IsA("AlignPosition")
		or d:IsA("AlignOrientation")
		or d:IsA("VectorForce")
end

function K.Kick(pl, txt)
	if pl and pl.Parent then
		pl:Kick(txt)
	end
end

function K.Log(pl, reason, w)
	local entry = "[KotowAC] " .. pl.Name .. " (" .. pl.UserId .. ") | " .. (reason or "?") .. " | warn " .. w
	print(entry .. " | " .. os.date("%H:%M:%S"))

	if K.Alert then
		K.Alert:FireAllClients(pl.Name, reason, w)
	end

	if K.Plugins.Webhook then
		K.Plugins.Webhook.Send(entry)
	end
end

function K.Punish(pl, reason)
	if K.Dead or K.DsDead then return end

	local s = K.State(pl.UserId)
	local now = os.clock()
	if s.lastPunish > 0 and now - s.lastPunish < K.Cfg.PCD then return end
	s.lastPunish = now

	s.wrn = s.wrn + 1

	local ok = pcall(K.Bans.SetAsync, K.Bans, "warn_" .. pl.UserId, {n = s.wrn, t = os.time()})
	if not ok then
		s.err.setW = (s.err.setW or 0) + 1
		if s.err.setW >= K.Cfg.EL then
			K.DsDead = true
			warn("[KotowAC] ds off: setW")
		end
	end

	K.Log(pl, reason, s.wrn)

	for _, punishFn in pairs(K.Punishes) do
		local ok2, result = pcall(punishFn, pl, s, reason)
		if ok2 and result == "stop" then
			return
		end
	end

	if s.wrn >= 4 then
		pcall(K.Bans.SetAsync, K.Bans, "ban_" .. pl.UserId, os.time() + K.Cfg.BT)
		K.Kick(pl, K.Msgs.ban[math.random(#K.Msgs.ban)])
	end
end

function K.AddDetect(name, fn, priority, cooldown)
	K.Detects[name] = {
		name = name,
		fn = fn,
		priority = priority or 100,
		cooldown = cooldown or 0,
	}
	K.DetectsDirty = true
end

function K.AddPunish(name, fn)
	K.Punishes[name] = fn
end

function K.RegisterPlugin(name, mod)
	K.Plugins[name] = mod
end

function K.RunDetects(pl, s)
	if K.DetectsDirty then
		K.DetectsSorted = {}
		for _, d in pairs(K.Detects) do
			table.insert(K.DetectsSorted, d)
		end
		table.sort(K.DetectsSorted, function(a, b)
			return a.priority < b.priority
		end)
		K.DetectsDirty = false
	end

	for _, d in ipairs(K.DetectsSorted) do
		if d.cooldown > 0 then
			local last = s.detectCooldown[d.name] or 0
			if os.clock() - last < d.cooldown then
				continue
			end
		end

		local ok, result = pcall(d.fn, pl, s)
		if ok and result then
			s.detectCooldown[d.name] = os.clock()
			return d.name
		end
	end
	return nil
end

function K.Bind(pl, ch)
	if K.Dead then return end
	if not pl or not ch then return end
	if not ch.Parent then return end

	local s = K.State(pl.UserId)

	if s.conns then
		for _, c in ipairs(s.conns) do
			pcall(function() c:Disconnect() end)
		end
	end
	s.conns = {}

	s.pl = pl
	s.ch = ch
	s.hum = ch:WaitForChild("Humanoid", 5)
	s.hrp = ch:WaitForChild("HumanoidRootPart", 5)

	if not s.hum or not s.hrp then return end

	s.fly = 0
	s.spd = 0
	s.jmp = 0
	s.lj = 0
	s.jumped = false
	s.jumpedAt = 0
	s.lastJumpY = nil
	s.upCount = 0
	s.upLastY = 0
	s.upStart = os.clock()
	s.lastPos = s.hrp.Position
	s.tpCount = 0
	s.grace = os.clock() + K.Cfg.GRACE
	s.freeTime = 0
	s.freeMove = 0
	s.detectCooldown = {}

	s.hum:SetAttribute("legitSpeed", 16)

	local c1 = ch.DescendantAdded:Connect(function(d)
		if K.Dead then return end
		if K.IsBodyMover(d) then
			K.Punish(pl, "body:" .. d.ClassName)
			task.defer(function()
				d:Destroy()
			end)
		end
	end)
	table.insert(s.conns, c1)

	local c2 = s.hum.StateChanged:Connect(function(_, new)
		if K.Dead then return end
		if new ~= Enum.HumanoidStateType.Jumping then return end

		s.jumped = true
		s.jumpedAt = os.clock()
		s.lastJumpY = s.hrp and s.hrp.Position.Y or 0

		local nw = os.clock()
		if nw - s.jsp.t > K.Cfg.SW then
			s.jsp = {n = 1, t = nw}
		else
			s.jsp.n = s.jsp.n + 1
			if s.jsp.n >= K.Cfg.SL then
				K.Kick(pl, "hvatit spamit XD")
				s.jsp = {n = 0, t = nw}
			end
		end

		if nw - s.lj > K.Cfg.JR then
			s.jmp = 0
		end
		s.lj = nw
		s.jmp = s.jmp + 1

		if s.jmp >= K.Cfg.MJ then
			K.Punish(pl, "jump")
		end
	end)
	table.insert(s.conns, c2)
end

function K.TickOne(uid)
	if K.Dead or K.DsDead then return end
	local s = K.S[uid]
	if not s or not s.ch or not s.hrp or not s.hum then return end
	if not s.ch.Parent or s.hum.Health <= 0 then return end

	local pl = s.pl
	if not pl or not s.hrp.Parent then return end

	local v = s.hrp.AssemblyLinearVelocity
	local h = Vector3.new(v.X, 0, v.Z).Magnitude
	local state = s.hum:GetState()
	local pos = s.hrp.Position
	local y = pos.Y
	local onGround = s.hum.FloorMaterial ~= Enum.Material.Air
	local inGrace = os.clock() < s.grace
	local move = s.hum.MoveDirection.Magnitude
	local inCar = pl:GetAttribute("inCar")

	local dist = s.lastPos and (pos - s.lastPos).Magnitude or 0
	s.lastPos = pos

	if onGround then
		s.freeTime = 0
		s.freeMove = 0
		s.fly = 0
		s.jumped = false
		s.jumpedAt = 0
		s.lastJumpY = nil
		s.upCount = 0
		s.upStart = os.clock()
		s.upLastY = y
	end

	if inGrace then return end

	local name = K.RunDetects(pl, s)
	if name then
		K.Punish(pl, name)
		return
	end

	local walkSpeed = s.hum.WalkSpeed
	local ls = s.hum:GetAttribute("legitSpeed") or 16
	if walkSpeed > ls + 9 and not inCar then
		K.Punish(pl, "ws:" .. tostring(walkSpeed))
		return
	end

	if dist > K.Cfg.TP and not s.jumped and onGround and not inCar then
		s.tpCount = s.tpCount + 1
		if s.tpCount >= K.Cfg.TPC then
			K.Punish(pl, "tp")
			s.tpCount = 0
			return
		end
	elseif dist <= K.Cfg.TP then
		s.tpCount = 0
	end

	if h > K.Cfg.MS and not inCar then
		s.spd = s.spd + 1
		if s.spd >= 4 then
			K.Punish(pl, "speed:" .. math.floor(h))
			s.spd = 0
			return
		end
	else
		s.spd = 0
	end

	if s.jumped
		and state == Enum.HumanoidStateType.Freefall
		and s.lastJumpY
		and y > s.lastJumpY + 15
		and v.Y < 0
		and not inCar then
		K.Punish(pl, "pos_jump")
		return
	end

	if s.jumped
		and state == Enum.HumanoidStateType.Freefall
		and os.clock() - s.jumpedAt > 2
		and dist > 10
		and v.Y > -30
		and not inCar then
		K.Punish(pl, "jumpmove")
		return
	end

	if state == Enum.HumanoidStateType.Freefall and v.Y > -50 then
		if y > s.upLastY + 2 then
			s.upCount = s.upCount + 1
		end
		s.upLastY = y

		local elapsed = os.clock() - s.upStart
		if s.upCount >= K.Cfg.UC and elapsed <= K.Cfg.UW then
			K.Punish(pl, "up")
			s.upCount = 0
			s.upStart = os.clock()
			return
		end
	end

	if state == Enum.HumanoidStateType.Freefall
		and not s.jumped
		and move > 0 then
		s.freeMove = s.freeMove + 0.5
		if s.freeMove >= K.Cfg.FREE_MOVE_LIM then
			K.Punish(pl, "airmove")
			s.freeMove = 0
			return
		end
	elseif onGround then
		s.freeMove = 0
	end

	if state == Enum.HumanoidStateType.Freefall
		and not s.jumped then
		s.freeTime = s.freeTime + 0.5
		if s.freeTime >= K.Cfg.L then
			K.Punish(pl, "freefall")
			s.freeTime = 0
		end
	end
end

function K.StartHeartbeat()
	local conn = rs.Heartbeat:Connect(function(dtF)
		if K.Dead then return end

		for uid, s in pairs(K.S) do
			local ch = s.ch
			if not ch or not ch.Parent then
				K.S[uid] = nil
				continue
			end

			local hrp = s.hrp
			if not hrp or not hrp.Parent then continue end

			local pl = s.pl
			if not pl then continue end

			local v = hrp.AssemblyLinearVelocity
			local h = Vector3.new(v.X, 0, v.Z).Magnitude
			local newY = v.Y

			if not pl:GetAttribute("inCar") then
				if h > K.Cfg.MS then
					v = Vector3.new(v.X / h * K.Cfg.MS, v.Y, v.Z / h * K.Cfg.MS)
				end

				if newY > 50 then
					newY = 50
				elseif newY < -150 then
					newY = -150
				end

				hrp.AssemblyLinearVelocity = Vector3.new(v.X, newY, v.Z)
			end
		end

		K.Acc = K.Acc + dtF
		if K.Acc >= 0.5 then
			K.Acc = 0
			for uid in pairs(K.S) do
				K.TickOne(uid)
			end
		end
	end)
	table.insert(K.Connections, conn)
end

function K.StartHoneypot()
	task.spawn(function()
		local base = workspace:WaitForChild("Baseplate", 10)
		if not base then return end
		if K.Dead then return end

		for _, p in ipairs(workspace:GetChildren()) do
			if p.Name == "_hp" then
				p:Destroy()
			end
		end

		local hp = Instance.new("Part")
		hp.Name = "_hp"
		hp.Size = Vector3.new(4, 4, 4)
		hp.Anchored = true
		hp.CanCollide = false
		hp.Transparency = 1
		hp.CanQuery = false
		hp.CanTouch = true
		hp.Position = Vector3.new(0, -100, 0)
		hp.Parent = workspace
		K.HP = hp

		local hpGrace = {}

		plrs.PlayerRemoving:Connect(function(pl)
			hpGrace[pl.UserId] = nil
		end)

		hp.Touched:Connect(function(hit)
			if K.Dead then return end
			local ch = hit:FindFirstAncestorOfClass("Model")
			if not ch then return end
			local pl = plrs:GetPlayerFromCharacter(ch)
			if not pl then return end

			local hrp = ch:FindFirstChild("HumanoidRootPart")
			if not hrp then return end

			if hrp.AssemblyLinearVelocity.Y < -50 then return end
			if hrp.Position.Y > -80 then return end

			local now = os.clock()
			if hpGrace[pl.UserId] and now - hpGrace[pl.UserId] < K.Cfg.HP_SAFE then return end
			hpGrace[pl.UserId] = now

			K.Punish(pl, "noclip_honeypot")
			if pl.Character then
				hrp.CFrame = CFrame.new(0, 100, 0)
			end
		end)

		while K.Running do
			task.wait(60)
			if not K.Running then break end
			local x = math.random(-500, 500)
			local z = math.random(-500, 500)
			hp.Position = Vector3.new(x, -100, z)
		end
	end)
end

function K.OnPlayerAdded(pl)
	if K.Dead then return end
	local s = K.State(pl.UserId)
	s.pl = pl

	local nw = os.clock()
	if nw - s.js.t > K.Cfg.SW then
		s.js = {n = 1, t = nw}
	else
		s.js.n = s.js.n + 1
		if s.js.n >= K.Cfg.SL then
			K.Kick(pl, "hvatit spamit XD")
			s.js = {n = 0, t = nw}
		end
	end

	local c1 = pl.CharacterAdded:Connect(function(ch)
		K.Bind(pl, ch)
	end)
	table.insert(K.Connections, c1)

	if pl.Character then
		task.spawn(K.Bind, pl, pl.Character)
	end

	task.spawn(function()
		if K.Dead then return end

		local ok, bu = pcall(K.Bans.GetAsync, K.Bans, "ban_" .. pl.UserId)
		if not ok then
			local k = "gB:" .. tostring(bu)
			s.err[k] = (s.err[k] or 0) + 1
			if s.err[k] >= K.Cfg.EL then
				K.Dead = true
				K.Dt = os.clock()
				warn("[KotowAC] off: " .. k)
			end
			bu = nil
		end

		if type(bu) == "number" and bu > os.time() then
			local left = math.floor((bu - os.time()) / 60)
			K.Kick(pl, "ban eshe " .. left .. " min")
			return
		end

		local ok2, wd = pcall(K.Bans.GetAsync, K.Bans, "warn_" .. pl.UserId)
		if not ok2 then
			local k = "gW:" .. tostring(wd)
			s.err[k] = (s.err[k] or 0) + 1
			if s.err[k] >= K.Cfg.EL then
				K.Dead = true
				K.Dt = os.clock()
				warn("[KotowAC] off: " .. k)
			end
			wd = nil
		end

		if type(wd) == "table"
			and type(wd.n) == "number"
			and type(wd.t) == "number"
			and os.time() - wd.t < K.Cfg.WR then
			s.wrn = wd.n
			if wd.n >= 4 then
				K.Bans:SetAsync("ban_" .. pl.UserId, os.time() + K.Cfg.BT)
				K.Kick(pl, K.Msgs.ban[math.random(#K.Msgs.ban)])
				return
			end
		else
			s.wrn = 0
		end
	end)
end

function K.OnPlayerRemoving(pl)
	local s = K.S[pl.UserId]
	if s then
		for _, c in ipairs(s.conns or {}) do
			pcall(function() c:Disconnect() end)
		end
	end
	K.S[pl.UserId] = nil
end

function K.Run()
	if K.Running then return end
	K.Running = true
	K.Dead = false
	K.DsDead = false
	K.Dt = nil
	K.Acc = 0
	K.Init()

	local c1 = plrs.PlayerAdded:Connect(K.OnPlayerAdded)
	table.insert(K.Connections, c1)

	local c2 = plrs.PlayerRemoving:Connect(K.OnPlayerRemoving)
	table.insert(K.Connections, c2)

	for _, pl in ipairs(plrs:GetPlayers()) do
		K.OnPlayerAdded(pl)
	end

	K.StartHeartbeat()
	K.StartHoneypot()

	task.spawn(function()
		while K.Running do
			task.wait(30)

			if (K.Dead or K.DsDead) and K.Dt and os.clock() - K.Dt >= K.Cfg.RT then
				K.Dead = false
				K.DsDead = false
				K.Dt = nil
				for _, s in pairs(K.S) do
					s.err = {}
					s.js = {n = 0, t = 0}
					s.jsp = {n = 0, t = 0}
				end
				warn("[KotowAC] revived")
			end
		end
	end)

	print("[KotowAC] v" .. K.Version .. " running")
end

function K.Stop()
	if not K.Running then return end
	K.Running = false
	K.Dead = true

	for _, conn in ipairs(K.Connections) do
		pcall(function() conn:Disconnect() end)
	end
	K.Connections = {}

	for _, s in pairs(K.S) do
		for _, c in ipairs(s.conns or {}) do
			pcall(function() c:Disconnect() end)
		end
		s.conns = {}
	end

	K.S = {}

	if K.HP then
		K.HP:Destroy()
		K.HP = nil
	end

	K.Acc = 0
	print("[KotowAC] stopped")
end

local URL = "" 

K.RegisterPlugin("Webhook", {
	Send = function(msg)
		if URL == "" then return end
		pcall(function()
			http:PostAsync(URL, http:JSONEncode({content = msg}))
		end)
	end,
})

if URL == "" then
	warn("[KotowAC] Webhook disabled (no URL)")
end

K.Run()

-- idi na hyi ya ne II;)
-- автор заебался