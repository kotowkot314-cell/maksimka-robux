local plrs = game:GetService("Players")
local dss = game:GetService("DataStoreService")
local rs = game:GetService("RunService")
local rs2 = game:GetService("ReplicatedStorage")
local bans = dss:GetDataStore("Bans_v1")
local logs = dss:GetDataStore("ACLogs_v1")

if rs:IsStudio() then return end

local alert = rs2:FindFirstChild("ACAlert")
if not alert then
	alert = Instance.new("RemoteEvent")
	alert.Name = "ACAlert"
	alert.Parent = rs2
end

local fly = {}
local spd = {}
local jmp = {}
local lj = {}
local wrn = {}
local err = {}
local js = {}
local jsp = {}
local jumped = {}
local jumpedAt = {}
local lastJumpY = {}
local upCount = {}
local upLastY = {}
local upStart = {}
local lastPos = {}
local tpCount = {}
local grace = {}
local freeTime = {}
local freeMove = {}
local lastPunish = {}
local chars = {}
local dead = false
local dsDead = false
local dt = nil
local HP_PART = nil

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

local ADMINS = {
	[1234567890] = true,
	[9876543210] = true,
}

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

local function kick(pl, txt)
	if pl and pl.Parent then
		pl:Kick(txt)
	end
end

local function logPunish(pl, reason, w)
	local entry = string.format("[AC] %s (%d) | %s | warn %d | %s",
		pl.Name, pl.UserId, reason, w, os.date("%H:%M:%S"))
	print(entry)
	alert:FireAllClients(pl.Name, reason, w)
end

local function addLog(pl, reason, w, pos, speed)
	task.spawn(function()
		local key = "log_" .. pl.UserId
		pcall(function()
			logs:UpdateAsync(key, function(data)
				if type(data) ~= "table" then
					data = {}
				end

				table.insert(data, {
					t = os.time(),
					r = reason,
					w = w,
					p = {math.floor(pos.X), math.floor(pos.Y), math.floor(pos.Z)},
					s = math.floor(speed),
				})

				if #data > 20 then
					table.remove(data, 1)
				end

				return data
			end)
		end)
	end)
end

local function punish(pl, reason)
	if dead or dsDead then return end

	local now = os.clock()
	if lastPunish[pl.UserId] and now - lastPunish[pl.UserId] < PCD then return end
	lastPunish[pl.UserId] = now

	local w = (wrn[pl.UserId] or 0) + 1
	wrn[pl.UserId] = w

	local ok = pcall(function()
		bans:SetAsync("warn_" .. pl.UserId, {n = w, t = os.time()})
	end)
	if not ok then
		err["setW"] = (err["setW"] or 0) + 1
		if err["setW"] >= EL then
			dsDead = true
			warn("anticheat ds off: setW")
		end
	end

	logPunish(pl, reason or "?", w)

	local ch = pl.Character
	local hrp = ch and ch:FindFirstChild("HumanoidRootPart")
	if hrp then
		local v = hrp.AssemblyLinearVelocity
		addLog(pl, reason or "?", w, hrp.Position, v.Magnitude)
	end

	if w >= 4 then
		pcall(function()
			bans:SetAsync("ban_" .. pl.UserId, os.time() + BT)
		end)
		kick(pl, msgs.ban[math.random(#msgs.ban)])
	end
end

local function scanBodies(pl, ch)
	for _, d in ipairs(ch:GetDescendants()) do
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
			d:Destroy()
			return true
		end
	end
	return false
end

local function onChar(pl)
	return function(ch)
		if dead then return end

		local head = ch:WaitForChild("Head")
		local nm = pl.Name
		local tag
		if nm == "i_Russianheh" then
			tag = "Creator"
		elseif nm == "sewit_cat" then
			tag = "*"
		end

		if tag then
			local old = head:FindFirstChild("NameTag")
			if old then old:Destroy() end

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

		local hum = ch:WaitForChild("Humanoid")
		local hrp = ch:WaitForChild("HumanoidRootPart")
		fly[pl.UserId] = 0
		spd[pl.UserId] = 0
		jmp[pl.UserId] = 0
		lj[pl.UserId] = 0
		jumped[pl.UserId] = false
		jumpedAt[pl.UserId] = 0
		lastJumpY[pl.UserId] = nil
		upCount[pl.UserId] = 0
		upLastY[pl.UserId] = 0
		upStart[pl.UserId] = os.clock()
		lastPos[pl.UserId] = hrp.Position
		tpCount[pl.UserId] = 0
		grace[pl.UserId] = os.clock() + GRACE
		freeTime[pl.UserId] = 0
		freeMove[pl.UserId] = 0

		hum:SetAttribute("legitSpeed", 16)

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

		local stateConn = hum.StateChanged:Connect(function(_, new)
			if dead then return end
			if new ~= Enum.HumanoidStateType.Jumping then return end

			jumped[pl.UserId] = true
			jumpedAt[pl.UserId] = os.clock()
			lastJumpY[pl.UserId] = hrp.Position.Y

			local nw = os.clock()
			local s = jsp[pl.UserId]
			if not s or nw - s.t > SW then
				jsp[pl.UserId] = {n = 1, t = nw}
			else
				s.n = s.n + 1
				if s.n >= SL then
					kick(pl, "hvatit spamit XD")
					jsp[pl.UserId] = {n = 0, t = nw}
				end
			end

			local now = os.clock()
			if now - lj[pl.UserId] > JR then
				jmp[pl.UserId] = 0
			end
			lj[pl.UserId] = now
			jmp[pl.UserId] = jmp[pl.UserId] + 1

			if jmp[pl.UserId] >= MJ then
				punish(pl, "jump")
			end
		end)

		task.spawn(function()
			while ch.Parent and hum.Health > 0 and not dead do
				task.wait(0.5)

				if not hrp or not hrp.Parent then
					break
				end

				local v = hrp.AssemblyLinearVelocity
				local h = Vector3.new(v.X, 0, v.Z).Magnitude
				local state = hum:GetState()
				local pos = hrp.Position
				local y = pos.Y
				local onGround = hum.FloorMaterial ~= Enum.Material.Air
				local inGrace = os.clock() < grace[pl.UserId]
				local move = hum.MoveDirection.Magnitude
				local inCar = pl:GetAttribute("inCar")

				local dist = (pos - lastPos[pl.UserId]).Magnitude
				lastPos[pl.UserId] = pos

				if onGround then
					freeTime[pl.UserId] = 0
					freeMove[pl.UserId] = 0
					jumped[pl.UserId] = false
					jumpedAt[pl.UserId] = 0
					lastJumpY[pl.UserId] = nil
					upCount[pl.UserId] = 0
					upStart[pl.UserId] = os.clock()
					upLastY[pl.UserId] = y
				end

				if not inGrace then
					local walkSpeed = hum.WalkSpeed
					local ls = hum:GetAttribute("legitSpeed") or 16
					if walkSpeed > ls + 9 and not inCar then
						punish(pl, "ws:" .. tostring(walkSpeed))
						break
					end

					if scanBodies(pl, ch) then
						break
					end

					if dist > TP and not jumped[pl.UserId] and onGround and not inCar then
						tpCount[pl.UserId] = tpCount[pl.UserId] + 1
						if tpCount[pl.UserId] >= TPC then
							punish(pl, "tp")
							tpCount[pl.UserId] = 0
							break
						end
					elseif dist <= TP then
						tpCount[pl.UserId] = 0
					end

					if h > MS and not inCar then
						spd[pl.UserId] = spd[pl.UserId] + 1
						if spd[pl.UserId] >= 4 then
							punish(pl, "speed:" .. math.floor(h))
							spd[pl.UserId] = 0
							break
						end
					else
						spd[pl.UserId] = 0
					end

					if jumped[pl.UserId]
						and state == Enum.HumanoidStateType.Freefall
						and lastJumpY[pl.UserId]
						and y > lastJumpY[pl.UserId] + 15
						and v.Y < 0
						and not inCar then
						punish(pl, "pos_jump")
						break
					end

					if jumped[pl.UserId]
						and state == Enum.HumanoidStateType.Freefall
						and os.clock() - jumpedAt[pl.UserId] > 2
						and dist > 10
						and v.Y > -30
						and not inCar then
						punish(pl, "jumpmove")
						break
					end

					if state == Enum.HumanoidStateType.Freefall and v.Y > -50 then
						local lastUp = upLastY[pl.UserId]
						if y > lastUp + 2 then
							upCount[pl.UserId] = upCount[pl.UserId] + 1
						end
						upLastY[pl.UserId] = y

						local elapsed = os.clock() - upStart[pl.UserId]
						if upCount[pl.UserId] >= UC and elapsed <= UW then
							punish(pl, "up")
							upCount[pl.UserId] = 0
							upStart[pl.UserId] = os.clock()
							break
						end
					end

					if state == Enum.HumanoidStateType.Freefall
						and not jumped[pl.UserId]
						and move > 0 then
						freeMove[pl.UserId] = freeMove[pl.UserId] + 0.5
						if freeMove[pl.UserId] >= FREE_MOVE_LIM then
							punish(pl, "airmove")
							freeMove[pl.UserId] = 0
							break
						end
					elseif onGround then
						freeMove[pl.UserId] = 0
					end

					if state == Enum.HumanoidStateType.Freefall
						and not jumped[pl.UserId] then
						freeTime[pl.UserId] = freeTime[pl.UserId] + 0.5
						if freeTime[pl.UserId] >= L then
							punish(pl, "freefall")
							freeTime[pl.UserId] = 0
							break
						end
					end
				end
			end
			stateConn:Disconnect()
		end)
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
	HP_PART = hp

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

rs.Heartbeat:Connect(function()
	if dead then return end
	for uid, ch in pairs(chars) do
		local pl = plrs:GetPlayerByUserId(uid)
		if not pl or pl:GetAttribute("inCar") then continue end
		local hrp = ch:FindFirstChild("HumanoidRootPart")
		if not hrp then continue end

		local v = hrp.AssemblyLinearVelocity
		local h = Vector3.new(v.X, 0, v.Z).Magnitude
		local newY = v.Y

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
end)

task.spawn(function()
	while true do
		task.wait(30)

		if (dead or dsDead) and dt and os.clock() - dt >= RT then
			dead = false
			dsDead = false
			dt = nil
			err = {}
			js = {}
			jsp = {}
			warn("anticheat revived")
		end
	end
end)

plrs.PlayerAdded:Connect(function(pl)
	if dead then return end

	local nw = os.clock()
	local s = js[pl.UserId]
	if not s or nw - s.t > SW then
		js[pl.UserId] = {n = 1, t = nw}
	else
		s.n = s.n + 1
		if s.n >= SL then
			kick(pl, "hvatit spamit XD")
			js[pl.UserId] = {n = 0, t = nw}
		end
	end

	pl.CharacterAdded:Connect(function(ch)
		chars[pl.UserId] = ch
		onChar(pl)(ch)
	end)
	if pl.Character then
		chars[pl.UserId] = pl.Character
		task.spawn(onChar(pl), pl.Character)
	end

	pl.Chatted:Connect(function(msg)
		if not ADMINS[pl.UserId] then return end

		if msg == "!achp" then
			if HP_PART and pl.Character then
				local hrp = pl.Character:FindFirstChild("HumanoidRootPart")
				if hrp then
					HP_PART.Position = hrp.Position - Vector3.new(0, 10, 0)
				end
			end
		elseif string.sub(msg, 1, 8) == "!aclogs " then
			local name = string.sub(msg, 9)
			local target = plrs:FindFirstChild(name)
			if not target then
				warn("no player: " .. name)
				return
			end
			print(string.format("[AC] %s current warns: %d", target.Name, wrn[target.UserId] or 0))
			local ok, data = pcall(function()
				return logs:GetAsync("log_" .. target.UserId)
			end)
			if ok and type(data) == "table" then
				for _, e in ipairs(data) do
					print(string.format("[LOG] %s | %s | warn %d | pos %d,%d,%d | spd %d",
						os.date("%H:%M:%S", e.t), e.r, e.w, e.p[1], e.p[2], e.p[3], e.s))
				end
			else
				warn("no logs for " .. name)
			end
		end
	end)

	task.spawn(function()
		if dead then return end

		local ok, bu = pcall(function()
			return bans:GetAsync("ban_" .. pl.UserId)
		end)
		if not ok then
			local k = "gB:" .. tostring(bu)
			err[k] = (err[k] or 0) + 1
			if err[k] >= EL then
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
			err[k] = (err[k] or 0) + 1
			if err[k] >= EL then
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
			wrn[pl.UserId] = wd.n
			if wd.n >= 4 then
				bans:SetAsync("ban_" .. pl.UserId, os.time() + BT)
				kick(pl, msgs.ban[math.random(#msgs.ban)])
				return
			end
		else
			wrn[pl.UserId] = 0
		end
	end)
end)

plrs.PlayerRemoving:Connect(function(pl)
	fly[pl.UserId] = nil
	spd[pl.UserId] = nil
	jmp[pl.UserId] = nil
	lj[pl.UserId] = nil
	wrn[pl.UserId] = nil
	js[pl.UserId] = nil
	jsp[pl.UserId] = nil
	jumped[pl.UserId] = nil
	jumpedAt[pl.UserId] = nil
	lastJumpY[pl.UserId] = nil
	upCount[pl.UserId] = nil
	upLastY[pl.UserId] = nil
	upStart[pl.UserId] = nil
	lastPos[pl.UserId] = nil
	tpCount[pl.UserId] = nil
	grace[pl.UserId] = nil
	freeTime[pl.UserId] = nil
	freeMove[pl.UserId] = nil
	lastPunish[pl.UserId] = nil
	chars[pl.UserId] = nil
end)
