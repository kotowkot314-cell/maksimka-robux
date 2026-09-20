local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local MAX_AIR = 5
local RAY_LEN = 12

local air = {}

Players.PlayerAdded:Connect(function(plr)
	plr.CharacterAdded:Connect(function(char)
		local hrp = char:WaitForChild("HumanoidRootPart")
		air[plr.UserId] = 0

		local conn
		conn = RunService.Heartbeat:Connect(function(dt)
			if not char.Parent or not hrp.Parent then
				conn:Disconnect()
				air[plr.UserId] = nil
				return
			end

			local params = RaycastParams.new()
			params.FilterDescendantsInstances = {char}
			params.FilterType = Enum.RaycastFilterType.Blacklist

			local hit = workspace:Raycast(hrp.Position, Vector3.new(0, -RAY_LEN, 0), params)

			if hit then
				air[plr.UserId] = 0
			else
				air[plr.UserId] = air[plr.UserId] + dt
				if air[plr.UserId] > MAX_AIR then
					plr:Kick("Anti-cheat: flying detected")
				end
			end
		end)
	end)
end)

Players.PlayerRemoving:Connect(function(plr)
	air[plr.UserId] = nil
end)