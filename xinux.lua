local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

local executorName = "Unknown"
local httpFunc = nil

if identifyexecutor then
    local ok, name = pcall(identifyexecutor)
    if ok then executorName = name end
elseif getexecutorname then
    local ok, name = pcall(getexecutorname)
    if ok then executorName = name end
end

if syn and syn.request then
    httpFunc = syn.request
elseif http and http.request then
    httpFunc = http.request
elseif fluxus and fluxus.request then
    httpFunc = fluxus.request
elseif request then
    httpFunc = request
elseif http_request then
    httpFunc = http_request
end

if executorName == "Unknown" and httpFunc then
    executorName = "Supported Executor"
end

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "xinux_Terminal"
ScreenGui.ResetOnSpawn = false
ScreenGui.Parent = PlayerGui

local LoadingFrame = Instance.new("Frame")
LoadingFrame.Size = UDim2.new(0, 100, 0, 100)
LoadingFrame.Position = UDim2.new(0.5, -50, 0.5, -50)
LoadingFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
LoadingFrame.BorderSizePixel = 0
LoadingFrame.Parent = ScreenGui
Instance.new("UICorner", LoadingFrame).CornerRadius = UDim.new(0, 8)

local LoadStroke = Instance.new("UIStroke")
LoadStroke.Color = Color3.fromRGB(0, 255, 100)
LoadStroke.Thickness = 2
LoadStroke.Parent = LoadingFrame

local Spinner = Instance.new("Frame")
Spinner.Size = UDim2.new(0, 40, 0, 40)
Spinner.Position = UDim2.new(0.5, -20, 0.5, -20)
Spinner.BackgroundColor3 = Color3.fromRGB(0, 255, 100)
Spinner.BorderSizePixel = 0
Spinner.Parent = LoadingFrame
Instance.new("UICorner", Spinner).CornerRadius = UDim.new(1, 0)

local SpinnerHole = Instance.new("Frame")
SpinnerHole.Size = UDim2.new(0, 30, 0, 30)
SpinnerHole.Position = UDim2.new(0.5, -15, 0.5, -15)
SpinnerHole.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
SpinnerHole.BorderSizePixel = 0
SpinnerHole.Parent = LoadingFrame
Instance.new("UICorner", SpinnerHole).CornerRadius = UDim.new(1, 0)

local SpinnerPiece = Instance.new("Frame")
SpinnerPiece.Size = UDim2.new(0, 40, 0, 20)
SpinnerPiece.Position = UDim2.new(0.5, -20, 0.5, -20)
SpinnerPiece.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
SpinnerPiece.BorderSizePixel = 0
SpinnerPiece.Parent = LoadingFrame

task.spawn(function()
    while LoadingFrame.Parent do
        for i = 1, 360, 10 do
            if not LoadingFrame.Parent then break end
            SpinnerPiece.Rotation = i
            task.wait(0.02)
        end
    end
end)

task.wait(3)
LoadingFrame:Destroy()

local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(0, 600, 0, 400)
MainFrame.Position = UDim2.new(0.5, -300, 0.5, -200)
MainFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 30)
MainFrame.BorderSizePixel = 0
MainFrame.Active = true
MainFrame.Draggable = true
MainFrame.ClipsDescendants = true
MainFrame.Parent = ScreenGui
Instance.new("UICorner", MainFrame).CornerRadius = UDim.new(0, 4)

local Stroke = Instance.new("UIStroke")
Stroke.Color = Color3.fromRGB(60, 60, 80)
Stroke.Thickness = 1
Stroke.Parent = MainFrame

local TopBar = Instance.new("Frame")
TopBar.Size = UDim2.new(1, 0, 0, 25)
TopBar.BackgroundColor3 = Color3.fromRGB(40, 40, 55)
TopBar.BorderSizePixel = 0
TopBar.ZIndex = 10
TopBar.Parent = MainFrame

local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, -40, 1, 0)
Title.Position = UDim2.new(0, 10, 0, 0)
Title.BackgroundTransparency = 1
Title.Text = "xinux"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.Font = Enum.Font.Code
Title.TextSize = 13
Title.TextXAlignment = Enum.TextXAlignment.Center
Title.ZIndex = 11
Title.Parent = TopBar

local CloseButton = Instance.new("TextButton")
CloseButton.Size = UDim2.new(0, 25, 0, 25)
CloseButton.Position = UDim2.new(1, -25, 0, 0)
CloseButton.BackgroundTransparency = 1
CloseButton.Text = "X"
CloseButton.TextColor3 = Color3.fromRGB(255, 100, 100)
CloseButton.Font = Enum.Font.Code
CloseButton.TextSize = 14
CloseButton.ZIndex = 11
CloseButton.Parent = TopBar
CloseButton.MouseButton1Click:Connect(function()
    ScreenGui:Destroy()
end)

local ScrollingFrame = Instance.new("ScrollingFrame")
ScrollingFrame.Size = UDim2.new(1, -10, 1, -65)
ScrollingFrame.Position = UDim2.new(0, 5, 0, 30)
ScrollingFrame.BackgroundTransparency = 1
ScrollingFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
ScrollingFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
ScrollingFrame.ScrollBarThickness = 4
ScrollingFrame.ScrollBarImageColor3 = Color3.fromRGB(100, 100, 120)
ScrollingFrame.ZIndex = 10
ScrollingFrame.Parent = MainFrame
Instance.new("UIListLayout", ScrollingFrame).Padding = UDim.new(0, 2)

local InputFrame = Instance.new("Frame")
InputFrame.Size = UDim2.new(1, 0, 0, 30)
InputFrame.Position = UDim2.new(0, 0, 1, -30)
InputFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 45)
InputFrame.BorderSizePixel = 0
InputFrame.ZIndex = 10
InputFrame.Parent = MainFrame

local Prompt = Instance.new("TextLabel")
Prompt.Size = UDim2.new(0, 90, 1, 0)
Prompt.Position = UDim2.new(0, 5, 0, 0)
Prompt.BackgroundTransparency = 1
Prompt.Text = "[bash-5.3]$"
Prompt.TextColor3 = Color3.fromRGB(0, 255, 100)
Prompt.Font = Enum.Font.Code
Prompt.TextSize = 14
Prompt.TextXAlignment = Enum.TextXAlignment.Left
Prompt.ZIndex = 11
Prompt.Parent = InputFrame

local InputBox = Instance.new("TextBox")
InputBox.Size = UDim2.new(1, -100, 1, 0)
InputBox.Position = UDim2.new(0, 95, 0, 0)
InputBox.BackgroundTransparency = 1
InputBox.Text = ""
InputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
InputBox.Font = Enum.Font.Code
InputBox.TextSize = 14
InputBox.TextXAlignment = Enum.TextXAlignment.Left
InputBox.ClearTextOnFocus = false
InputBox.ZIndex = 11
InputBox.Parent = InputFrame

local function addLine(text, color)
    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, -10, 0, 16)
    label.BackgroundTransparency = 1
    label.Text = text
    label.TextColor3 = color or Color3.fromRGB(220, 220, 220)
    label.Font = Enum.Font.Code
    label.TextSize = 13
    label.TextXAlignment = Enum.TextXAlignment.Left
    label.TextWrapped = true
    label.ZIndex = 10
    label.Parent = ScrollingFrame
end

local penguinArt = [[
       .--.       
      |o_o |      
      |:_/ |      
     //   \ \     
    (|     | )    
   /'\_   _/`\    
   \___)=(___/    
]]

for line in penguinArt:gmatch("[^\r\n]+") do
    addLine(line, Color3.fromRGB(255, 255, 255))
end

addLine("OS: xinux (Roblox Client)", Color3.fromRGB(255, 255, 255))
addLine("Kernel: roblox-luau", Color3.fromRGB(255, 255, 255))
addLine("Executor: " .. executorName, Color3.fromRGB(0, 255, 100))
addLine("Type 'help' for commands.", Color3.fromRGB(150, 150, 150))
addLine("")

local isConnected = false

local function getErrorMessage(code)
    if code == 400 then return "400 Bad Request - Invalid syntax" end
    if code == 401 then return "401 Unauthorized - Authentication required" end
    if code == 403 then return "403 Forbidden - Access denied (firewall/blocked)" end
    if code == 404 then return "404 Not Found - Endpoint does not exist" end
    if code == 408 then return "408 Request Timeout - Server timed out" end
    if code == 429 then return "429 Too Many Requests - Rate limit exceeded" end
    if code == 500 then return "500 Internal Server Error - Server crashed" end
    if code == 502 then return "502 Bad Gateway - Proxy error" end
    if code == 503 then return "503 Service Unavailable - Server overloaded/maintenance" end
    if code == 504 then return "504 Gateway Timeout - Proxy timeout" end
    return "Unknown Error - Code: " .. tostring(code)
end

local defaultCommands = {
    help = { action = function() 
        local status = isConnected and "Connected" or "Local"
        return "Commands: help, clear, players, kick, teleport, ping, cnkt\nStatus: " .. status
    end },
    ping = { action = function() 
        local start = tick()
        pcall(function()
            if httpFunc then
                httpFunc({ Url = "https://roblox.com", Method = "HEAD" })
            end
        end)
        local finish = tick()
        return "Pong! Latency: " .. math.floor((finish - start) * 1000) .. "ms" 
    end },
    clear = { action = function() return "CLEAR" end },
    players = { action = function() 
        local list = {}
        for _, p in ipairs(Players:GetPlayers()) do table.insert(list, p.Name) end
        return table.concat(list, "\n")
    end },
    teleport = { action = function(args)
        local target = args[1]
        if not target then return "Usage: teleport <name>" end
        local t = Players:FindFirstChild(target)
        if t and t.Character and LocalPlayer.Character then
            LocalPlayer.Character:SetPrimaryPartCFrame(t.Character.PrimaryPart.CFrame)
            return "Teleported to " .. target
        end
        return "Player not found"
    end },
    kick = { action = function(args)
        local target = args[1]
        if not target then return "Usage: kick <name>" end
        local t = Players:FindFirstChild(target)
        if t then t:Kick("Kicked by xinux") return "Kicked " .. target end
        return "Player not found"
    end },
    cnkt = { action = function()
        if not httpFunc then return "Error: HTTP not supported by this executor." end
        
        local success, response = pcall(function()
            return httpFunc({
                Url = "https://roblox.com",
                Method = "HEAD"
            })
        end)
        
        if success and response then
            if response.StatusCode == 200 or response.StatusCode == 301 then
                isConnected = true
                return "Connection successful! Server responded."
            else
                isConnected = false
                return "Connection failed: " .. getErrorMessage(response.StatusCode)
            end
        else
            isConnected = false
            return "Connection failed: Executor/Game blocked the request (nil response)"
        end
    end }
}

InputBox.FocusLost:Connect(function(enterPressed)
    if enterPressed then
        local cmdText = InputBox.Text
        if cmdText == "" then return end
        InputBox.Text = ""
        
        addLine("[bash-5.3]$ " .. cmdText, Color3.fromRGB(0, 255, 100))
        
        local parts = {}
        for word in cmdText:gmatch("%S+") do table.insert(parts, word) end
        local cmdName = parts[1]
        table.remove(parts, 1)
        local args = parts
        
        if cmdName == "clear" then
            for _, child in ipairs(ScrollingFrame:GetChildren()) do
                if child:IsA("TextLabel") then child:Destroy() end
            end
            return
        end
        
        if defaultCommands[cmdName] then
            task.spawn(function()
                local success, result = pcall(defaultCommands[cmdName].action, args)
                if success then
                    addLine(tostring(result), Color3.fromRGB(255, 255, 255))
                else
                    addLine("Error: " .. tostring(result), Color3.fromRGB(255, 100, 100))
                end
            end)
            return
        end
        
        addLine(cmdName .. ": command not found", Color3.fromRGB(255, 100, 100))
        
        task.wait()
        ScrollingFrame.CanvasPosition = Vector2.new(0, ScrollingFrame.AbsoluteCanvasSize.Y)
    end
end)