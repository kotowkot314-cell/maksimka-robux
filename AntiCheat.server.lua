-- AntiCheat.server.lua
-- Серверный античит для Roblox-игры.
-- Ставить в ServerScriptService как Script с именем AntiCheat.
-- В Studio не работает (IsStudio), тестировать только на опубликованной игре.
--
-- Что ловит:
--   fly, speed, tp, jumpmove, pos_jump, airmove, freefall, up, jump, body, noclip_honeypot.
-- Что делает:
--   выдает варны, кикает на 4-й, банит на час через DataStore.
-- Что нужно для спринта:
--   hum:SetAttribute("legitSpeed", 22) при включении, 16 при выключении.
-- Что нужно для машин:
--   pl:SetAttribute("inCar", true) при посадке, false при выходе.
-- Кому ставить намтеги:
--   i_Russianheh ("Creator"), sewit_cat ("*").
-- Логи и админка убраны по требованию.

local plrs = game:GetService("Players")
local dss = game:GetService("DataStoreService")
local rs = game:GetService("RunService")
local rs2 = game:GetService("ReplicatedStorage")
local bans = dss:GetDataStore("Bans_v1")

if rs:IsStudio() then return end

local alert = rs2:FindFirstChild("ACAlert")
if not alert then
	alert = Instance.new("RemoteEvent")
	alert.Name = "ACAlert"
	alert.Parent = rs2
end

local S = {}
local dead = false
local dsDead = false
local dt = nil
local HP = nil
local acc = 0

local L = 4
local MS = 80
local JR = 2
local BT = 3600
local WR = 1800
local EL = 2
local RT = 3600
local SL = 30
local SW = 5
local MJ = 7
local UC = 5
local UW = 3
local TP = 50
local TPC = 2
local GRACE = 5
local PCD = 2
local FREE_MOVE_LIM = 2
local HP_SAFE = 30

local msgs = {
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

local function st(uid)
	local s = S[uid]
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
		}
		S[uid] = s
	end
	return s
end

local function kick(pl, txt)
	if pl and pl.Parent then
		pl:Kick(txt)
	end
end

local function punish(pl, reason)
	if dead or dsDead then return end

	local s = st(pl.UserId)
	local now = os.clock()
	if s.lastPunish > 0 and now - s.lastPunish < PCD then return end
	s.lastPunish = now

	s.wrn = s.wrn + 1

	local ok = pcall(function()
		bans:SetAsync("warn_" .. pl.UserId, {n = s.wrn, t = os.time()})
	end)
	if not ok then
		s.err["setW"] = (s.err["setW"] or 0) + 1
		if s.err["setW"] >= EL then
			dsDead = true
			warn("anticheat ds off: setW")
		end
	end

	local entry = string.format("[AC] %s (%d) | %s | warn %d | %s",
		pl.Name, pl.UserId, reason or "?", s.wrn, os.date("%H:%M:%S"))
	print(entry)
	alert:FireAllClients(pl.Name, reason, s.wrn)

	if s.wrn >= 4 then
		pcall(function()
			bans:SetAsync("ban_" .. pl.UserId, os.time() + BT)
		end)
		kick(pl, msgs.ban[math.random(#msgs.ban)])
	end
end

local function scanBodies(pl, ch)
	local d = ch:FindFirstChildOfClass("BodyVelocity")
		or ch:FindFirstChildOfClass("BodyGyro")
		or ch:FindFirstChildOfClass("BodyAngularVelocity")
		or ch:FindFirstChildOfClass("BodyPosition")
		or ch:FindFirstChildOfClass("BodyThrust")
		or ch:FindFirstChildOfClass("BodyForce")
		or ch:FindFirstChildOfClass("LinearVelocity")
		or ch:FindFirstChildOfClass("AngularVelocity")
		or ch:FindFirstChildOfClass("AlignPosition")
		or ch:FindFirstChildOfClass("AlignOrientation")
		or ch:FindFirstChildOfClass("VectorForce")

	if d then
		punish(pl, "body:" .. d.ClassName)
		d:Destroy()
		return true
	end
	return false
end

local function addNameTag(pl, ch)
	local nm = pl.Name
	if nm ~= "i_Russianheh" and nm ~= "sewit_cat" then return end

	local head = ch:WaitForChild("Head", 5)
	if not head then return end
	local old = head:FindFirstChild("NameTag")
	if old then old:Destroy() end

	local tag = nm == "i_Russianheh" and "Creator" or "*"

	local bb = Instance.new("BillboardGui")
	bb.Name = "NameTag"
	bb.Size = UDim2.new(0, 200, 0, 50)
	bb.StudsOffset = Vector3.new(0, 2.5, 0)
	bb.AlwaysOnTop = true
	bb.Parent = head

	local txt = Instance.new("TextLabel")
	txt.Size = UDim2.new(1, 0, 1, 0)
	txt.BackgroundTransparency = 1
	txt.Text = tag
	txt.TextScaled = true
	txt.Font = Enum.Font.GothamBold
	txt.TextColor3 = Color3.fromRGB(255, 255, 255)
	txt.TextStrokeTransparency = 0
	txt.Parent = bb
end

local function onState(pl, _, new)
	if dead then return end
	if new ~= Enum.HumanoidStateType.Jumping then return end

	local s = st(pl.UserId)
	local hrp = s.hrp
	if not hrp then return end

	s.jumped = true
	s.jumpedAt = os.clock()
	s.lastJumpY = hrp.Position.Y

	local nw = os.clock()
	if nw - s.jsp.t > SW then
		s.jsp = {n = 1, t = nw}
	else
		s.jsp.n = s.jsp.n + 1
		if s.jsp.n >= SL then
			kick(pl, "hvatit spamit XD")
			s.jsp = {n = 0, t = nw}
		end
	end

	if nw - s.lj > JR then
		s.jmp = 0
	end
	s.lj = nw
	s.jmp = s.jmp + 1

	if s.jmp >= MJ then
		punish(pl, "jump")
	end
end

local function bind(pl, ch)
	local s = st(pl.UserId)
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
	s.grace = os.clock() + GRACE
	s.freeTime = 0
	s.freeMove = 0

	s.hum:SetAttribute("legitSpeed", 16)

	ch.DescendantAdded:Connect(function(d)
		if dead then return end
		if d:IsA("BodyVelocity")
			or d:IsA("BodyGyro")
			or d:IsA("BodyAngularVelocity")
			or d:IsA("BodyPosition")
			or d:IsA("BodyThrust")
			or d:IsA("BodyForce")
			or d:IsA("LinearVelocity")
			or d:IsA("AngularVelocity")
			or d:IsA("AlignPosition")
			or d:IsA("AlignOrientation")
			or d:IsA("VectorForce") then
			punish(pl, "body:" .. d.ClassName)
			task.defer(function()
				d:Destroy()
			end)
		end
	end)

	s.hum.StateChanged:Connect(function(_, new)
		onState(pl, _, new)
	end)

	addNameTag(pl, ch)
end

local function tick_one(uid)
	if dead or dsDead then return end
	local s = S[uid]
	if not s or not s.ch or not s.hrp or not s.hum then return end
	if not s.ch.Parent or s.hum.Health <= 0 then return end

	local pl = s.pl
	if not pl then return end

	local ch = s.ch
	local hum = s.hum
	local hrp = s.hrp

	if not hrp.Parent then return end

	local v = hrp.AssemblyLinearVelocity
	local h = Vector3.new(v.X, 0, v.Z).Magnitude
	local state = hum:GetState()
	local pos = hrp.Position
	local y = pos.Y
	local onGround = hum.FloorMaterial ~= Enum.Material.Air
	local inGrace = os.clock() < s.grace
	local move = hum.MoveDirection.Magnitude
	local inCar = pl:GetAttribute("inCar")

	local dist = s.lastPos and (pos - s.lastPos).Magnitude or 0
	s.lastPos = pos

	if onGround then
		s.freeTime = 0
		s.freeMove = 0
		s.jumped = false
		s.jumpedAt = 0
		s.lastJumpY = nil
		s.upCount = 0
		s.upStart = os.clock()
		s.upLastY = y
	end

	if inGrace then return end

	local walkSpeed = hum.WalkSpeed
	local ls = hum:GetAttribute("legitSpeed") or 16
	if walkSpeed > ls + 9 and not inCar then
		punish(pl, "ws:" .. tostring(walkSpeed))
		return
	end

	if scanBodies(pl, ch) then return end

	if dist > TP and not s.jumped and onGround and not inCar then
		s.tpCount = s.tpCount + 1
		if s.tpCount >= TPC then
			punish(pl, "tp")
			s.tpCount = 0
			return
		end
	elseif dist <= TP then
		s.tpCount = 0
	end

	if h > MS and not inCar then
		s.spd = s.spd + 1
		if s.spd >= 4 then
			punish(pl, "speed:" .. math.floor(h))
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
		punish(pl, "pos_jump")
		return
	end

	if s.jumped
		and state == Enum.HumanoidStateType.Freefall
		and os.clock() - s.jumpedAt > 2
		and dist > 10
		and v.Y > -30
		and not inCar then
		punish(pl, "jumpmove")
		return
	end

	if state == Enum.HumanoidStateType.Freefall and v.Y > -50 then
		if y > s.upLastY + 2 then
			s.upCount = s.upCount + 1
		end
		s.upLastY = y

		local elapsed = os.clock() - s.upStart
		if s.upCount >= UC and elapsed <= UW then
			punish(pl, "up")
			s.upCount = 0
			s.upStart = os.clock()
			return
		end
	end

	if state == Enum.HumanoidStateType.Freefall
		and not s.jumped
		and move > 0 then
		s.freeMove = s.freeMove + 0.5
		if s.freeMove >= FREE_MOVE_LIM then
			punish(pl, "airmove")
			s.freeMove = 0
			return
		end
	elseif onGround then
		s.freeMove = 0
	end

	if state == Enum.HumanoidStateType.Freefall
		and not s.jumped then
		s.freeTime = s.freeTime + 0.5
		if s.freeTime >= L then
			punish(pl, "freefall")
			s.freeTime = 0
		end
	end
end

-- idi na hyi ya ne II;)
-- автор заебался

task.spawn(function()
	local base = workspace:WaitForChild("Baseplate", 10)
	if not base then return end
	if dead then return end

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
	HP = hp

	local hpGrace = {}

	plrs.PlayerRemoving:Connect(function(pl)
		hpGrace[pl.UserId] = nil
	end)

	hp.Touched:Connect(function(hit)
		if dead then return end
		local ch = hit:FindFirstAncestorOfClass("Model")
		if not ch then return end
		local pl = plrs:GetPlayerFromCharacter(ch)
		if not pl then return end

		local hrp = ch:FindFirstChild("HumanoidRootPart")
		if not hrp then return end

		if hrp.AssemblyLinearVelocity.Y < -50 then return end
		if hrp.Position.Y > -80 then return end

		local now = os.clock()
		if hpGrace[pl.UserId] and now - hpGrace[pl.UserId] < HP_SAFE then return end
		hpGrace[pl.UserId] = now

		punish(pl, "noclip_honeypot")
		if pl.Character then
			hrp.CFrame = CFrame.new(0, 100, 0)
		end
	end)

	while not dead do
		task.wait(60)
		local x = math.random(-500, 500)
		local z = math.random(-500, 500)
		hp.Position = Vector3.new(x, -100, z)
	end
end)

rs.Heartbeat:Connect(function(dtF)
	if dead then return end

	for uid, s in pairs(S) do
		local ch = s.ch
		if not ch or not ch.Parent then
			S[uid] = nil
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
			if h > MS then
				v = Vector3.new(v.X / h * MS, v.Y, v.Z / h * MS)
			end

			if newY > 50 then
				newY = 50
			elseif newY < -150 then
				newY = -150
			end

			hrp.AssemblyLinearVelocity = Vector3.new(v.X, newY, v.Z)
		end
	end

	acc = acc + dtF
	if acc >= 0.5 then
		acc = 0
		for uid in pairs(S) do
			tick_one(uid)
		end
	end
end)

task.spawn(function()
	while true do
		task.wait(30)

		if (dead or dsDead) and dt and os.clock() - dt >= RT then
			dead = false
			dsDead = false
			dt = nil
			for _, s in pairs(S) do
				s.err = {}
				s.js = {n = 0, t = 0}
				s.jsp = {n = 0, t = 0}
			end
			warn("anticheat revived")
		end
	end
end)

plrs.PlayerAdded:Connect(function(pl)
	if dead then return end
	local s = st(pl.UserId)
	s.pl = pl

	local nw = os.clock()
	if nw - s.js.t > SW then
		s.js = {n = 1, t = nw}
	else
		s.js.n = s.js.n + 1
		if s.js.n >= SL then
			kick(pl, "hvatit spamit XD")
			s.js = {n = 0, t = nw}
		end
	end

	pl.CharacterAdded:Connect(function(ch)
		bind(pl, ch)
	end)
	if pl.Character then
		task.spawn(bind, pl, pl.Character)
	end

	task.spawn(function()
		if dead then return end

		local ok, bu = pcall(function()
			return bans:GetAsync("ban_" .. pl.UserId)
		end)
		if not ok then
			local k = "gB:" .. tostring(bu)
			s.err[k] = (s.err[k] or 0) + 1
			if s.err[k] >= EL then
				dead = true
				dt = os.clock()
				warn("anticheat off: " .. k)
			end
			bu = nil
		end

		if type(bu) == "number" and bu > os.time() then
			local left = math.floor((bu - os.time()) / 60)
			kick(pl, "ban eshe " .. left .. " min")
			return
		end

		local ok2, wd = pcall(function()
			return bans:GetAsync("warn_" .. pl.UserId)
		end)
		if not ok2 then
			local k = "gW:" .. tostring(wd)
			s.err[k] = (s.err[k] or 0) + 1
			if s.err[k] >= EL then
				dead = true
				dt = os.clock()
				warn("anticheat off: " .. k)
			end
			wd = nil
		end

		if type(wd) == "table"
			and type(wd.n) == "number"
			and type(wd.t) == "number"
			and os.time() - wd.t < WR then
			s.wrn = wd.n
			if wd.n >= 4 then
				bans:SetAsync("ban_" .. pl.UserId, os.time() + BT)
				kick(pl, msgs.ban[math.random(#msgs.ban)])
				return
			end
		else
			s.wrn = 0
		end
	end)
end)

plrs.PlayerRemoving:Connect(function(pl)
	S[pl.UserId] = nil
end)