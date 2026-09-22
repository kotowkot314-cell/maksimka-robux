--[[
    KotowAC v4.2.9 — серверный античит для Roblox.

    KotowAC v4.2.9
    Author: kotowkot314-cell
    Repo:   github.com/kotowkot314-cell/maksimka-robux
    I'm tired, but it works XD

    Установка:
      ServerScriptService/KotowAC (Script)
      StarterPlayerScripts/ACReport (LocalScript)

    Патчи v4.2.9:
      10. StartHeartbeat: не мутируем K.S внутри pairs.
      11. Suspicion в DescendantAdded через task.defer.
      12. Клиент: backoff для fetchToken (5/10/20/40/60).
      13. Клиент: проверка pl.Parent перед FireServer.

    Автор: kotowkot314-cell
    Репа:  github.com/kotowkot314-cell/maksimka-robux
    Лицензия: MIT
]]

local plrs = game:GetService("Players")
local dss = game:GetService("DataStoreService")
local rs = game:GetService("RunService")
local rs2 = game:GetService("ReplicatedStorage")
local http = game:GetService("HttpService")

if rs:IsStudio() then return end

local K = {}

K.Version = "4.2.9"
K.Name = "KotowAC"
K.Running = false

K.Cfg = {
	FreefallLimit = 4,
	MaxSpeed = 80,
	SpeedClampMult = 1.5,
	JumpReset = 2,
	BanTime = 3600,
	WarnReset = 1800,
	ErrLimit = 10,
	ErrWindow = 60,
	DsDownLimit = 5,
	DsDownTime = 60,
	SpamLimit = 30,
	SpamWindow = 5,
	MaxJumps = 10,
	UpCount = 5,
	UpWindow = 3,
	TeleportDist = 50,
	TeleportCount = 2,
	GraceTime = 5,
	PunishCooldown = 2,
	FreeMoveLimit = 2,
	SuspKick = 8,
	SuspBan = 15,
	PingMax = 150,
	SuspDecay = 1,
	SuspDecayTime = 60,
	ReportTimeout = 30,
	LogCooldown = 5,
	LogLevel = 1,
	WebhookURL = "",
	PunishRules = {
		body = "ban",
		cframe = "ban",
		speed = "kick",
		tp = "kick",
		freefall = "log",
		report = "log",
		token = "log",
		jump = "log",
		ws = "kick",
		jump_power = "kick",
		hip_height = "kick",
		pos_jump = "kick",
		jumpmove = "kick",
		up = "kick",
		airmove = "kick",
		noclip_honeypot = "kick",
		macro = "kick",
	},
	CFrameWindow = 60,
	HoneypotCount = 8,
	HoneypotSize = 8,
	HoneypotRange = 500,
	HoneypotY = -100,
	MinAccountAge = 30,
	NewAccountSusp = 3,
	MacroWindow = 3,
	MacroTolerance = 0.05,
	MacroSamples = 10,
	WhitelistTags = {
		lift = {"tp", "speed", "freefall", "airmove"},
		trampoline = {"up", "pos_jump", "freefall"},
		admin = {"ws", "speed", "tp", "freefall", "airmove", "up", "pos_jump", "jumpmove", "body", "cframe", "hip_height", "jump_power", "noclip_honeypot"},
	},
}

K.Msgs = {
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
K.DsDown = false
K.DsDownAt = 0
K.DsDownCount = 0
K.DsErrCount = 0
K.DsErrAt = 0
K.Acc = 0
K.StatsGen = 0
K.Bans = nil
K.Logs = nil
K.Alert = nil
K.Report = nil
K.GetToken = nil
K.Stats = {}
K.Random = Random.new()

function K.Init()
	K.Bans = dss:GetDataStore("KotowAC_Bans_v1")
	K.Logs = dss:GetDataStore("KotowAC_Logs_v1")

	K.Alert = rs2:FindFirstChild("ACAlert")
	if not K.Alert then
		K.Alert = Instance.new("RemoteEvent")
		K.Alert.Name = "ACAlert"
		K.Alert.Parent = rs2
	end

	K.Report = rs2:FindFirstChild("ACReport")
	if not K.Report then
		K.Report = Instance.new("RemoteEvent")
		K.Report.Name = "ACReport"
		K.Report.Parent = rs2
	end

	K.GetToken = rs2:FindFirstChild("ACGetToken")
	if not K.GetToken then
		K.GetToken = Instance.new("RemoteFunction")
		K.GetToken.Name = "ACGetToken"
		K.GetToken.Parent = rs2
	end

	K.GetToken.OnServerInvoke = function(pl)
		local s = K.S[pl.UserId]
		if not s then return nil end
		local now = os.clock()
		if now - (s.lastTokenFetch or 0) < 1 then
			s.tokenSpam = (s.tokenSpam or 0) + 1
			if s.tokenSpam >= 5 then
				local spam = s.tokenSpam
				s.tokenSpam = 0
				task.defer(function()
					if pl.Parent then
						K.Suspicion(pl, 2, "token:spam:" .. spam)
					end
				end)
			end
			return s.token
		end
		s.lastTokenFetch = now
		s.tokenSpam = 0
		if not s.token then
			s.token = K.GenToken(pl.UserId)
		end
		return s.token
	end

	K.Log(1, "init v" .. K.Version)
end

function K.Log(level, msg)
	if level < K.Cfg.LogLevel then return end
	local prefix = "[KotowAC]"
	if level == 1 then prefix = prefix .. " [INFO]" end
	if level == 2 then prefix = prefix .. " [WARN]" end
	if level == 3 then prefix = prefix .. " [ERR]" end
	print(prefix .. " " .. msg)
end

function K.Webhook(msg)
	if K.Cfg.WebhookURL == "" then return end
	if not string.find(K.Cfg.WebhookURL, "discord%.com/api/webhooks/") then return end
	pcall(function()
		http:PostAsync(K.Cfg.WebhookURL, http:JSONEncode({content = msg}))
	end)
end

function K.StatsInc(key)
	K.Stats[key] = (K.Stats[key] or 0) + 1
end

function K.DsErr(reason)
	local now = os.clock()
	if now - K.DsErrAt > K.Cfg.ErrWindow then
		K.DsErrCount = 0
	end
	K.DsErrAt = now
	K.DsErrCount = K.DsErrCount + 1

	if K.DsErrCount >= K.Cfg.ErrLimit then
		if not K.DsDead then
			K.DsDead = true
			K.Log(3, "ds dead: " .. (reason or "?") .. " (" .. K.DsErrCount .. " errors)")
		end
	end
end

function K.DsCheck()
	if K.DsDown then
		if os.clock() - K.DsDownAt > K.Cfg.DsDownTime then
			K.DsDown = false
			K.DsDownCount = 0
			K.Log(1, "ds down reset")
		end
	end
end

function K.DsDownInc()
	K.DsDownCount = K.DsDownCount + 1
	if K.DsDownCount >= K.Cfg.DsDownLimit then
		if not K.DsDown then
			K.DsDown = true
			K.DsDownAt = os.clock()
			K.Log(3, "ds down: " .. K.DsDownCount .. " fails")
		end
	end
end

function K.State(uid)
	local s = K.S[uid]
	if not s then
		s = {
			fly = 0, spd = 0, jmp = 0, lj = 0,
			jumped = false, jumpedAt = 0, lastJumpY = nil,
			upCount = 0, upLastY = 0, upStart = 0,
			lastPos = nil, lastCFrame = nil, tpCount = 0,
			grace = 0, freeTime = 0, freeMove = 0,
			lastPunish = 0, wrn = 0,
			jsp = {n = 0, t = 0},
			ch = nil, hum = nil, hrp = nil, pl = nil,
			detectCooldown = {},
			conns = {},
			susp = 0,
			suspAt = 0,
			lastDecay = 0,
			lastReport = 0,
			token = nil,
			lastLog = 0,
			inCar = false,
			wlTag = nil,
			wlChecks = nil,
			legitSpeed = nil,
			lastTokenFetch = -10,
			tokenSpam = 0,
			cframeCount = 0,
			cframeAt = 0,
			jumpTimes = {},
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

function K.SetInCar(pl, state)
	local s = K.State(pl.UserId)
	s.inCar = state and true or false
end

function K.SetWhitelist(pl, tag)
	local s = K.State(pl.UserId)
	s.wlTag = tag
	s.wlChecks = K.Cfg.WhitelistTags[tag]
end

function K.SetLegitSpeed(pl, value)
	if type(value) ~= "number" then return end
	if value < 0 or value > 200 then return end
	local s = K.State(pl.UserId)
	s.legitSpeed = value
	if s.hum then
		s.hum:SetAttribute("legitSpeed", value)
	end
end

function K.IsWhitelisted(pl, check)
	local s = K.State(pl.UserId)
	if not s.wlTag or s.wlTag == "" then return false end
	if not check then return true end
	local list = s.wlChecks
	if not list then return false end
	for _, name in ipairs(list) do
		if name == check then return true end
	end
	return false
end

function K.GetPing(pl)
	local ok, ping = pcall(function()
		return pl:GetNetworkPing() * 1000
	end)
	if ok then return ping end
	return 0
end

function K.LogPunish(pl, reason, w)
	local entry = "[KotowAC] " .. pl.Name .. " (" .. pl.UserId .. ") | " .. (reason or "?") .. " | warn " .. w
	K.Log(2, entry .. " | " .. os.date("%H:%M:%S"))

	if K.Alert then
		K.Alert:FireAllClients(pl.Name, reason, w)
	end

	K.Webhook(entry)
end

function K.Suspicion(pl, weight, reason)
	if K.Dead then return end
	if not pl.Parent then return end
	local s = K.State(pl.UserId)
	s.susp = s.susp + weight
	s.suspAt = os.clock()
	K.StatsInc(reason or "?")

	if K.Logs and weight >= 3 and not K.DsDead then
		local now = os.clock()
		if now - s.lastLog >= K.Cfg.LogCooldown then
			s.lastLog = now
			local uid = pl.UserId
			local suspNow = s.susp
			task.spawn(function()
				local ok = pcall(K.Logs.UpdateAsync, K.Logs, "susp_" .. uid, function(data)
					if type(data) ~= "table" then
						data = {history = {}}
					end
					if type(data.history) ~= "table" then
						data.history = {}
					end

					table.insert(data.history, {
						n = suspNow,
						w = weight,
						r = reason,
						t = os.time(),
					})

					if #data.history > 20 then
						table.remove(data.history, 1)
					end

					data.last = {
						n = suspNow,
						w = weight,
						r = reason,
						t = os.time(),
					}

					return data
				end)
				if not ok then
					K.DsErr("log:susp")
				end
			end)
		end
	end

	local rule = nil
	if reason then
		for key, action in pairs(K.Cfg.PunishRules) do
			if string.find(reason, key, 1, true) == 1 then
				rule = action
				break
			end
		end
	end

	if rule == "ban" then
		K.Punish(pl, "rule_ban:" .. (reason or "?"))
		s.susp = 0
		s.cframeCount = 0
		s.cframeAt = 0
	elseif rule == "kick" and s.susp >= K.Cfg.SuspKick then
		K.Punish(pl, "rule_kick:" .. (reason or "?"))
		s.susp = 0
		s.cframeCount = 0
		s.cframeAt = 0
	elseif rule == "log" then
		-- только susp
	elseif s.susp >= K.Cfg.SuspBan then
		K.Punish(pl, "susp_ban:" .. (reason or "?"))
		s.susp = 0
		s.cframeCount = 0
		s.cframeAt = 0
	elseif s.susp >= K.Cfg.SuspKick then
		K.Punish(pl, "susp_kick:" .. (reason or "?"))
		s.susp = 0
		s.cframeCount = 0
		s.cframeAt = 0
	end
end

function K.Punish(pl, reason)
	if K.Dead then return end
	if not pl.Parent then return end

	local s = K.State(pl.UserId)
	local now = os.clock()
	if s.lastPunish > 0 and now - s.lastPunish < K.Cfg.PunishCooldown then return end
	s.lastPunish = now

	s.wrn = s.wrn + 1

	local uid = pl.UserId
	local wrnNow = s.wrn
	local suspNow = s.susp
	local banUntil = os.time() + K.Cfg.BanTime
	local lastLog = s.lastLog

	task.spawn(function()
		if not K.DsDead then
			local ok = pcall(K.Bans.SetAsync, K.Bans, "warn_" .. uid, {n = wrnNow, t = os.time()})
			if not ok then
				K.DsErr("set:warn")
			end
		end

		if K.Logs and not K.DsDead then
			local now2 = os.clock()
			if now2 - lastLog >= K.Cfg.LogCooldown then
				local s2 = K.S[uid]
				if s2 then s2.lastLog = now2 end
				local ok = pcall(K.Logs.SetAsync, K.Logs, "punish_" .. uid, {
					n = wrnNow,
					s = suspNow,
					r = reason,
					t = os.time(),
				})
				if not ok then
					K.DsErr("log:punish")
				end
			end
		end
	end)

	K.LogPunish(pl, reason, s.wrn)

	for _, punishFn in pairs(K.Punishes) do
		local ok2, result = pcall(punishFn, pl, s, reason)
		if ok2 and result == "stop" then
			return
		end
	end

	local isBan = s.wrn >= 4 or (reason and string.find(reason, "rule_ban:", 1, true) == 1)

	if isBan then
		local msg = K.Msgs.ban[math.random(#K.Msgs.ban)]
		task.spawn(function()
			local ok = pcall(K.Bans.SetAsync, K.Bans, "ban_" .. uid, banUntil)
			if not ok then
				K.DsErr("set:ban")
			end
			K.Kick(pl, msg)
		end)
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
		local skip = false
		if d.cooldown > 0 then
			local last = s.detectCooldown[d.name] or 0
			if os.clock() - last < d.cooldown then
				skip = true
			end
		end

		if not skip then
			local ok, result = pcall(d.fn, pl, s)
			s.detectCooldown[d.name] = os.clock()
			if ok and result then
				return d.name
			end
		end
	end
	return nil
end

function K.GenToken(uid)
	local a = K.Random:NextNumber(100000, 999999)
	local b = K.Random:NextInteger(0, 0x7FFFFFFF)
	local c = uid or 0
	return string.format("%x%x%x", math.floor(a), b, c)
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

	if not s.token then
		s.token = K.GenToken(pl.UserId)
	end
	s.lastReport = os.clock()

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
	s.lastCFrame = s.hrp.CFrame
	s.tpCount = 0
	s.grace = os.clock() + K.Cfg.GraceTime
	s.freeTime = 0
	s.freeMove = 0
	s.detectCooldown = {}
	s.cframeCount = 0
	s.cframeAt = 0
	s.tokenSpam = 0
	s.jumpTimes = {}

	if not s.legitSpeed or s.legitSpeed <= 0 then
		s.legitSpeed = s.hum.WalkSpeed
	end
	s.hum:SetAttribute("legitSpeed", s.legitSpeed)

	local c1 = ch.DescendantAdded:Connect(function(d)
		if K.Dead then return end
		if K.IsBodyMover(d) and not K.IsWhitelisted(pl, "body") then
			local className = d.ClassName
			task.defer(function()
				if pl.Parent then
					K.Suspicion(pl, 5, "body:" .. className)
				end
			end)
			task.defer(function()
				d:Destroy()
			end)
		end
	end)
	table.insert(s.conns, c1)

	local c2 = s.hum.StateChanged:Connect(function(_, new)
		if K.Dead then return end
		if new ~= Enum.HumanoidStateType.Jumping then return end

		local now = os.clock()
		s.jumped = true
		s.jumpedAt = now
		s.lastJumpY = s.hrp and s.hrp.Position.Y or 0

		table.insert(s.jumpTimes, now)
		if #s.jumpTimes > K.Cfg.MacroSamples then
			table.remove(s.jumpTimes, 1)
		end

		if #s.jumpTimes >= K.Cfg.MacroSamples then
			local sum, count = 0, 0
			for i = 2, #s.jumpTimes do
				local diff = s.jumpTimes[i] - s.jumpTimes[i-1]
				if diff < K.Cfg.MacroWindow then
					sum = sum + diff
					count = count + 1
				end
			end
			if count >= K.Cfg.MacroSamples - 2 then
				local avg = sum / count
				local variance = 0
				for i = 2, #s.jumpTimes do
					local diff = s.jumpTimes[i] - s.jumpTimes[i-1]
					if diff < K.Cfg.MacroWindow then
						variance = variance + math.abs(diff - avg)
					end
				end
				local dev = variance / count
				if dev < K.Cfg.MacroTolerance then
					s.jumpTimes = {}
					task.defer(function()
						if pl.Parent then
							K.Suspicion(pl, 4, "macro:jump")
						end
					end)
				end
			end
		end

		local nw = os.clock()
		if nw - s.jsp.t > K.Cfg.SpamWindow then
			s.jsp = {n = 1, t = nw}
		else
			s.jsp.n = s.jsp.n + 1
			if s.jsp.n >= K.Cfg.SpamLimit then
				s.jsp = {n = 0, t = nw}
				task.defer(function()
					if pl.Parent then
						K.Kick(pl, "hvatit spamit XD")
					end
				end)
			end
		end

		if nw - s.lj > K.Cfg.JumpReset then
			s.jmp = 0
		end
		s.lj = nw
		s.jmp = s.jmp + 1

		if s.jmp >= K.Cfg.MaxJumps then
			task.defer(function()
				if pl.Parent then
					K.Suspicion(pl, 3, "jump")
				end
			end)
		end
	end)
	table.insert(s.conns, c2)
end

function K.TickOne(uid)
	if K.Dead then return end
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
	local cf = s.hrp.CFrame
	local onGround = s.hum.FloorMaterial ~= Enum.Material.Air
	local inGrace = os.clock() < s.grace
	local move = s.hum.MoveDirection.Magnitude
	local inCar = s.inCar
	local wl = K.IsWhitelisted(pl)
	local ping = K.GetPing(pl)
	local mult = 1 + math.min(ping, K.Cfg.PingMax) / 500

	local dist = s.lastPos and (pos - s.lastPos).Magnitude or 0
	s.lastPos = pos

	local cfDist = s.lastCFrame and (cf.Position - s.lastCFrame.Position).Magnitude or 0
	s.lastCFrame = cf

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

	if s.susp > 0 and os.clock() - s.lastDecay > K.Cfg.SuspDecayTime then
		s.susp = math.max(0, s.susp - K.Cfg.SuspDecay)
		s.lastDecay = os.clock()
	end

	if os.clock() - s.lastReport > K.Cfg.ReportTimeout and not wl then
		K.Suspicion(pl, 2, "report:timeout")
		s.lastReport = os.clock()
	end

	if inGrace then return end

	local walkSpeed = s.hum.WalkSpeed
	local ls = s.legitSpeed or 16

	if walkSpeed > ls + 9 and not inCar and not K.IsWhitelisted(pl, "ws") then
		K.Suspicion(pl, 4, "ws:" .. tostring(walkSpeed))
		return
	end

	local jumpPower = s.hum.JumpPower
	if jumpPower > 100 and not K.IsWhitelisted(pl, "jump_power") then
		K.Suspicion(pl, 4, "jump_power")
		return
	end

	local hipHeight = s.hum.HipHeight
	if (hipHeight > 10 or hipHeight < -10) and not inCar and not K.IsWhitelisted(pl, "hip_height") then
		K.Suspicion(pl, 4, "hip_height")
		return
	end

	local name = K.RunDetects(pl, s)
	if name then
		K.Suspicion(pl, 3, name)
		return
	end

	if cfDist > 5 and h < 15 and not inCar and not K.IsWhitelisted(pl, "cframe") then
		local now = os.clock()
		if now - s.cframeAt > K.Cfg.CFrameWindow then
			s.cframeCount = 0
		end
		s.cframeAt = now
		s.cframeCount = s.cframeCount + 1

		if s.cframeCount > 2 then
			K.Suspicion(pl, 2, "cframe:" .. math.floor(cfDist))
		end
		return
	end

	if dist > K.Cfg.TeleportDist * mult and not s.jumped and onGround and not inCar and not K.IsWhitelisted(pl, "tp") then
		s.tpCount = s.tpCount + 1
		if s.tpCount >= K.Cfg.TeleportCount then
			K.Suspicion(pl, 4, "tp")
			s.tpCount = 0
			return
		end
	elseif dist <= K.Cfg.TeleportDist then
		s.tpCount = 0
	end

	if h > K.Cfg.MaxSpeed and not inCar and not K.IsWhitelisted(pl, "speed") then
		s.spd = s.spd + 1
		if s.spd >= 4 then
			K.Suspicion(pl, 3, "speed:" .. math.floor(h))
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
		and dist > 20
		and v.Y > -5
		and not inCar
		and not K.IsWhitelisted(pl, "pos_jump") then
		K.Suspicion(pl, 4, "pos_jump")
		return
	end

	if s.jumped
		and state == Enum.HumanoidStateType.Freefall
		and os.clock() - s.jumpedAt > 2
		and dist > 10
		and v.Y < -30
		and not inCar
		and not K.IsWhitelisted(pl, "jumpmove") then
		K.Suspicion(pl, 3, "jumpmove")
		return
	end

	if s.jumped
		and state == Enum.HumanoidStateType.Freefall
		and v.Y > -10
		and not K.IsWhitelisted(pl, "up") then
		if y > s.upLastY + 2 then
			s.upCount = s.upCount + 1
		end
		s.upLastY = y

		local elapsed = os.clock() - s.upStart
		if s.upCount >= K.Cfg.UpCount and elapsed <= K.Cfg.UpWindow then
			K.Suspicion(pl, 5, "up")
			s.upCount = 0
			s.upStart = os.clock()
			return
		end
	end

	if state == Enum.HumanoidStateType.Freefall
		and not s.jumped
		and move > 0
		and v.Y < -30
		and not K.IsWhitelisted(pl, "airmove") then
		s.freeMove = s.freeMove + 0.5
		if s.freeMove >= K.Cfg.FreeMoveLimit then
			K.Suspicion(pl, 4, "airmove")
			s.freeMove = 0
			return
		end
	elseif onGround then
		s.freeMove = 0
	end

	if state == Enum.HumanoidStateType.Freefall
		and not s.jumped
		and v.Y < -30
		and not K.IsWhitelisted(pl, "freefall") then
		s.freeTime = s.freeTime + 0.5
		if s.freeTime >= K.Cfg.FreefallLimit then
			K.Suspicion(pl, 5, "freefall")
			s.freeTime = 0
		end
	end
end

function K.StartHeartbeat()
	local conn = rs.Heartbeat:Connect(function(dtF)
		if K.Dead then return end

		K.DsCheck()

		local dead = nil
		for uid, s in pairs(K.S) do
			local ch = s.ch
			if not ch or not ch.Parent then
				dead = dead or {}
				table.insert(dead, uid)
			else
				local hrp = s.hrp
				if hrp and hrp.Parent then
					local pl = s.pl
					if pl then
						local v = hrp.AssemblyLinearVelocity
						local h = Vector3.new(v.X, 0, v.Z).Magnitude
						local newY = v.Y

						if not s.inCar then
							local limit = K.Cfg.MaxSpeed * K.Cfg.SpeedClampMult
							if h > limit then
								v = Vector3.new(
									v.X / h * K.Cfg.MaxSpeed,
									v.Y,
									v.Z / h * K.Cfg.MaxSpeed
								)
							end

							if newY > 50 then newY = 50 end
							if newY < -150 then newY = -150 end

							hrp.AssemblyLinearVelocity = Vector3.new(v.X, newY, v.Z)
						end
					end
				end
			end
		end

		if dead then
			for _, uid in ipairs(dead) do
				K.S[uid] = nil
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

function K.StartReportListener()
	local conn = K.Report.OnServerEvent:Connect(function(pl, ws, token)
		if K.Dead then return end
		local s = K.S[pl.UserId]
		if not s then return end

		local now = os.clock()
		if now - s.lastReport < 0.5 then
			s.lastReport = now
			K.Suspicion(pl, 1, "report:spam")
			return
		end
		s.lastReport = now

		if token ~= s.token then
			K.Suspicion(pl, 2, "report:token")
			s.lastReport = os.clock()
			return
		end

		if type(ws) ~= "number" then
			K.Suspicion(pl, 2, "report:bad_ws")
			return
		end

		if ws < 0 or ws > 500 then
			K.Suspicion(pl, 5, "report:ws")
			return
		end
	end)
	table.insert(K.Connections, conn)
end

function K.StartHoneypot()
	task.spawn(function()
		if K.Dead then return end

		local sizeVec = Vector3.new(K.Cfg.HoneypotSize, K.Cfg.HoneypotSize, K.Cfg.HoneypotSize)

		while K.Running do
			task.wait(5)

			for i = 1, K.Cfg.HoneypotCount do
				local center = Vector3.new(
					math.random(-K.Cfg.HoneypotRange, K.Cfg.HoneypotRange),
					K.Cfg.HoneypotY,
					math.random(-K.Cfg.HoneypotRange, K.Cfg.HoneypotRange)
				)

				local parts = workspace:GetPartBoundsInBox(
					CFrame.new(center),
					sizeVec
				)

				for _, part in ipairs(parts) do
					if part:IsA("BasePart") and part.Name == "HumanoidRootPart" then
						local ch = part.Parent
						if ch and ch:IsA("Model") then
							local pl = plrs:GetPlayerFromCharacter(ch)
							if pl and pl.Character == ch then
								if part.AssemblyLinearVelocity.Y >= -50 then
									if not K.IsWhitelisted(pl, "noclip_honeypot") then
										K.Suspicion(pl, 5, "noclip_honeypot")
									end
								end
							end
						end
					end
				end
			end
		end
	end)
end

function K.OnPlayerAdded(pl)
	if K.Dead then return end
	local s = K.State(pl.UserId)
	s.pl = pl

	if pl.AccountAge < K.Cfg.MinAccountAge then
		s.susp = s.susp + K.Cfg.NewAccountSusp
		K.Log(2, "new account: " .. pl.Name .. " (age " .. pl.AccountAge .. ")")
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

		local ok, bu
		for attempt = 1, 3 do
			ok, bu = pcall(K.Bans.GetAsync, K.Bans, "ban_" .. pl.UserId)
			if ok then break end
			task.wait(0.5)
		end
		if not ok then
			K.DsErr("get:ban")
			K.DsDownInc()
			K.Log(3, "ds fail get:ban, kick " .. pl.Name)
			K.Kick(pl, "ac: ds unavailable")
			return
		end

		K.DsDownCount = 0
		if K.DsDown then
			K.DsDown = false
			K.DsDownAt = 0
			K.Log(1, "ds down reset (recovered)")
		end

		if type(bu) == "number" and bu > os.time() then
			local left = math.floor((bu - os.time()) / 60)
			K.Kick(pl, "ban eshe " .. left .. " min")
			return
		end

		local ok2, wd
		for attempt = 1, 3 do
			ok2, wd = pcall(K.Bans.GetAsync, K.Bans, "warn_" .. pl.UserId)
			if ok2 then break end
			task.wait(0.5)
		end
		if not ok2 then
			K.DsErr("get:warn")
			K.DsDownInc()
			K.Log(3, "ds fail get:warn, kick " .. pl.Name)
			K.Kick(pl, "ac: ds unavailable")
			return
		end

		if K.DsDown then
			K.DsDown = false
			K.DsDownAt = 0
			K.Log(1, "ds down reset (recovered, warn)")
		end

		if type(wd) == "table"
			and type(wd.n) == "number"
			and type(wd.t) == "number"
			and os.time() - wd.t < K.Cfg.WarnReset then
			s.wrn = wd.n
			if wd.n >= 4 then
				local msg = K.Msgs.ban[math.random(#K.Msgs.ban)]
				task.spawn(function()
					local ok3 = pcall(K.Bans.SetAsync, K.Bans, "ban_" .. pl.UserId, os.time() + K.Cfg.BanTime)
					if not ok3 then
						K.DsErr("set:ban")
					end
					K.Kick(pl, msg)
				end)
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

		if K.Logs and not K.DsDead then
			local uid = pl.UserId
			local data = {susp = s.susp, wrn = s.wrn, t = os.time()}
			task.spawn(function()
				local ok = pcall(K.Logs.SetAsync, K.Logs, "last_" .. uid, data)
				if not ok then
					K.DsErr("log:last")
				end
			end)
		end
	end
	K.S[pl.UserId] = nil
end

function K.Run()
	if K.Running then return end
	K.Running = true
	K.Dead = false
	K.DsDead = false
	K.DsDown = false
	K.DsDownAt = 0
	K.DsDownCount = 0
	K.DsErrCount = 0
	K.DsErrAt = 0
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
	K.StartReportListener()

	K.StatsGen = K.StatsGen + 1
	local myGen = K.StatsGen
	task.spawn(function()
		while K.Running and K.StatsGen == myGen do
			task.wait(3600)
			if K.StatsGen == myGen then
				K.Stats = {}
			end
		end
	end)

	print("[KotowAC] v" .. K.Version .. " running")
end

function K.Stop()
	if not K.Running then return end
	K.Running = false
	K.Dead = true
	K.StatsGen = K.StatsGen + 1

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
	K.Acc = 0
	print("[KotowAC] stopped")
end

K.Run()

-- idi na hyi ya ne II;)
-- автор за####ся XD