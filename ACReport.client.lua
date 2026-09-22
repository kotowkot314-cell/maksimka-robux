local plrs = game:GetService("Players")
local rs = game:GetService("RunService")
local rs2 = game:GetService("ReplicatedStorage")
local pl = plrs.LocalPlayer

local report = rs2:WaitForChild("ACReport", 10)
if not report then return end

local getToken = rs2:WaitForChild("ACGetToken", 10)
local alert = rs2:WaitForChild("ACAlert", 10)

local token = nil
local lastSend = 0
local lastAlert = 0
local nextFetchAt = 0

local function fetchToken()
	if not getToken then return end
	local ok, t = pcall(function()
		return getToken:InvokeServer()
	end)
	if ok and type(t) == "string" then
		token = t
	end
	nextFetchAt = os.clock() + 5
end

fetchToken()

pl.CharacterAdded:Connect(function()
	task.wait(1)
	fetchToken()
end)

rs.Heartbeat:Connect(function()
	if not token then
		if os.clock() >= nextFetchAt then
			fetchToken()
		end
		return
	end

	local now = os.clock()
	if now - lastSend < 1 then return end
	lastSend = now

	local ch = pl.Character
	if not ch then return end
	local hum = ch:FindFirstChildOfClass("Humanoid")
	if not hum then return end

	report:FireServer(hum.WalkSpeed, token)
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