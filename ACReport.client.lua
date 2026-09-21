local plrs = game:GetService("Players")
local rs = game:GetService("RunService")
local rs2 = game:GetService("ReplicatedStorage")
local pl = plrs.LocalPlayer

local report = rs2:WaitForChild("ACReport", 10)
if not report then return end

local alert = rs2:WaitForChild("ACAlert", 10)

local lastSend = 0
local lastAlert = 0

rs.Heartbeat:Connect(function()
	local now = os.clock()
	if now - lastSend < 1 then return end
	lastSend = now

	local ch = pl.Character
	if not ch then return end
	local hum = ch:FindFirstChildOfClass("Humanoid")
	if not hum then return end

	report:FireServer(hum.WalkSpeed)
end)

if alert then
	alert.OnClientEvent:Connect(function(name, reason, warns)
		local now = os.clock()
		if now - lastAlert < 0.5 then return end
		lastAlert = now

		local ok, chat = pcall(function()
			return game:GetService("TextChatService").TextChannels:FindFirstChild("RBXGeneral")
		end)
		if ok and chat then
			pcall(function()
				chat:DisplaySystemMessage("[AC] " .. name .. " | " .. reason .. " | warn " .. warns)
			end)
		end
	end)
end