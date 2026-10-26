local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")
local HttpService = game:GetService("HttpService")

local SERVER_URL = "https://Maxxi1mka.pythonanywhere.com/terminal"
local COMMANDS_URL = "https://raw.githubusercontent.com/kotowkot314-cell/maksimka-robux/main/commands.x.lua"

local executorName = "Unknown"
local httpFunc = nil

if syn and syn.request then
    executorName = "Synapse / Delta"
    httpFunc = syn.request
elseif http and http.request then
    executorName = "Krnl / Fluxus"
    httpFunc = http.request
elseif fluxus and fluxus.request then
    executorName = "Fluxus"
    httpFunc = fluxus.request
elseif request then
    executorName = "Wave / Solara / R7 / Xeno"
    httpFunc = request
elseif http_request then
    executorName = "Old Executor"
    httpFunc = http_request
end

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "xinux_Terminal"
ScreenGui.ResetOnSpawn = false
ScreenGui.Parent = PlayerGui

local LoadingFrame = Instance.new("Frame")
LoadingFrame.Size = UDim2.new(0, 400, 0, 150)
LoadingFrame.Position = UDim2.new(0.5, -200, 0.5, -75)
LoadingFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
LoadingFrame.BorderSizePixel = 0
LoadingFrame.Parent = ScreenGui
Instance.new("UICorner", LoadingFrame).CornerRadius = UDim.new(0, 8)

local LoadStroke = Instance.new("UIStroke")
LoadStroke.Color = Color3.fromRGB(0, 255, 100)
LoadStroke.Thickness = 2
LoadStroke.Parent = LoadingFrame

local LoadText = Instance.new("TextLabel")
LoadText.Size = UDim2.new(1, 0, 1, 0)
LoadText.BackgroundTransparency = 1
LoadText.Text = "Загрузка xinux..."
LoadText.TextColor3 = Color3.fromRGB(0, 255, 100)
LoadText.Font = Enum.Font.Code
LoadText.TextSize = 18
LoadText.TextWrapped = true
LoadText.Parent = LoadingFrame

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

local customCommands = {}
local isCustomLoaded = false

-- Загрузка команд с GitHub
task.spawn(function()
    if not httpFunc then return end
    local success, response = pcall(function()
        return httpFunc({
            Url = COMMANDS_URL,
            Method = "GET"
        })
    end)
    
    if success and response and response.Body then
        local func, err = loadstring(response.Body)
        if func then
            local ok, result = pcall(func)
            if ok and type(result) == "table" then
                customCommands = result
                isCustomLoaded = true
                addLine("[OK] Загружено команд с GitHub: " .. tostring(#customCommands), Color3.fromRGB(0, 255, 100))
            else
                addLine("[ERR] Ошибка выполнения команд", Color3.fromRGB(255, 100, 100))
            end
        else
            addLine("[ERR] Ошибка синтаксиса в commands.x.lua", Color3.fromRGB(255, 100, 100))
        end
    else
        addLine("[ERR] Не удалось загрузить команды с GitHub", Color3.fromRGB(255, 100, 100))
    end
end)

local function sendRequest(cmd)
    local payload = '{"command": "' .. cmd .. '"}'
    if httpFunc then
        local success, response = pcall(function()
            return httpFunc({
                Url = SERVER_URL,
                Method = "POST",
                Headers = { ["Content-Type"] = "application/json" },
                Body = payload
            })
        end)
        if success and response and response.Body then
            local output = response.Body:match('"output"%s*:%s*"(.-)"')
            if output then
                output = output:gsub("\\n", "\n"):gsub('\\"', '"')
                return output
            end
            return response.Body
        else
            return nil, tostring(response)
        end
    else
        return nil, "No HTTP method available"
    end
end

InputBox.FocusLost:Connect(function(enterPressed)
    if enterPressed then
        local cmdText = InputBox.Text
        if cmdText == "" then return end
        InputBox.Text = ""
        
        addLine("[bash-5.3]$ " .. cmdText, Color3.fromRGB(0, 255, 100))
        
        local parts = cmdText:split(" ")
        local cmdName = parts[1]
        table.remove(parts, 1)
        local args = parts
        
        -- Проверка кастомных команд (с GitHub)
        if customCommands[cmdName] then
            task.spawn(function()
                local success, result = pcall(customCommands[cmdName].action, args)
                if success then
                    addLine(tostring(result), Color3.fromRGB(255, 255, 255))
                else
                    addLine("Error: " .. tostring(result), Color3.fromRGB(255, 100, 100))
                end
            end)
            return
        end
        
        -- Если команда не найдена локально, шлем на сервер
        task.spawn(function()
            local result, err = sendRequest(cmdText)
            if result then
                if result == "CLEAR" then
                    for _, child in ipairs(ScrollingFrame:GetChildren()) do
                        if child:IsA("TextLabel") then child:Destroy() end
                    end
                else
                    addLine(result, Color3.fromRGB(255, 255, 255))
                end
            else
                addLine("Error: " .. tostring(err), Color3.fromRGB(255, 100, 100))
            end
            task.wait()
            ScrollingFrame.CanvasPosition = Vector2.new(0, ScrollingFrame.AbsoluteCanvasSize.Y)
        end)
    end
end)