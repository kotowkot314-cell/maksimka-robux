local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")

local SERVER_URL = "https://maxxi1mka.pythonanywhere.com/terminal"

local Terminal = {}

local FS = {
    ["/"] = { type = "dir", content = {} },
    ["/home"] = { type = "dir", content = {} },
    ["/home/user"] = { type = "dir", content = {} }
}

local current_path = "/home/user"
local history = {}
local history_index = 0

local function resolve_path(path)
    if path:sub(1, 1) == "/" then return path end
    if path == ".." then
        local parts = string.split(current_path, "/")
        table.remove(parts)
        return table.concat(parts, "/")
    end
    return current_path .. "/" .. path
end

local function send_command(cmd)
    return "Offline mode: Server not connected yet. Command: " .. cmd
end

local commands = {}

commands["ls"] = function(args)
    local target = resolve_path(args[1] or "")
    if FS[target] and FS[target].type == "dir" then
        local out = ""
        for name, node in pairs(FS[target].content) do out = out .. name .. "  " end
        return out
    end
    return "ls: cannot access '" .. (args[1] or "") .. "': No such file or directory"
end

commands["pwd"] = function(args) return current_path end

commands["cd"] = function(args)
    local target = resolve_path(args[1] or "/")
    if FS[target] and FS[target].type == "dir" then current_path = target return "" end
    return "cd: no such file or directory: " .. (args[1] or "")
end

commands["echo"] = function(args) return table.concat(args, " ") end

commands["mkdir"] = function(args)
    local target = resolve_path(args[1] or "")
    if not FS[target] then
        FS[current_path].content[args[1]] = { type = "dir", content = {} }
        FS[target] = FS[current_path].content[args[1]]
        return ""
    end
    return "mkdir: cannot create directory '" .. args[1] .. "': File exists"
end

commands["touch"] = function(args)
    local target = resolve_path(args[1] or "")
    if not FS[target] then
        FS[current_path].content[args[1]] = { type = "file", content = "" }
        FS[target] = FS[current_path].content[args[1]]
        return ""
    end
    return ""
end

commands["cat"] = function(args)
    if #args == 0 then return "cat: missing operand" end
    local target = resolve_path(args[1])
    if FS[target] and FS[target].type == "file" then return FS[target].content end
    return "cat: " .. args[1] .. ": No such file or directory"
end

commands["rm"] = function(args)
    local target = resolve_path(args[1] or "")
    if FS[target] then
        FS[target] = nil
        local parts = string.split(target, "/")
        local name = parts[#parts]
        table.remove(parts)
        local parent = table.concat(parts, "/")
        if FS[parent] then FS[parent].content[name] = nil end
        return ""
    end
    return "rm: cannot remove '" .. (args[1] or "") .. "': No such file or directory"
end

commands["whoami"] = function(args) return "user" end
commands["uname"] = function(args) return "KotowAC Linux 1.0 (Luau x86_64)" end

commands["history"] = function(args)
    local out = ""
    for i, cmd in ipairs(history) do out = out .. i .. "  " .. cmd .. "\n" end
    return out
end

commands["help"] = function(args)
    return "Available: ls, pwd, cd, echo, mkdir, touch, cat, rm, whoami, uname, history, clear, help"
end

commands["clear"] = function(args) return "CLEAR_SCREEN" end

function Terminal.Execute(cmd_string)
    if cmd_string == "" then return "" end
    table.insert(history, cmd_string)
    history_index = #history + 1

    local args = string.split(cmd_string, " ")
    local cmd = args[1]
    table.remove(args, 1)

    if commands[cmd] then
        local success, result = pcall(commands[cmd], args)
        if success then return result
        else return "Error: " .. tostring(result) end
    else
        return send_command(cmd_string)
    end
end

function Terminal.Start()
    local PlayerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
    local old = PlayerGui:FindFirstChild("KotowAC_Terminal")
    if old then old:Destroy() end

    local ScreenGui = Instance.new("ScreenGui")
    ScreenGui.Name = "KotowAC_Terminal"
    ScreenGui.Parent = PlayerGui
    ScreenGui.ResetOnSpawn = false

    local MainFrame = Instance.new("Frame")
    MainFrame.Size = UDim2.new(0, 600, 0, 400)
    MainFrame.Position = UDim2.new(0.5, -300, 0.5, -200)
    MainFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
    MainFrame.BorderSizePixel = 0
    MainFrame.Active = true
    MainFrame.Draggable = true
    MainFrame.Parent = ScreenGui

    local UICorner = Instance.new("UICorner")
    UICorner.CornerRadius = UDim.new(0, 6)
    UICorner.Parent = MainFrame

    local TopBar = Instance.new("Frame")
    TopBar.Size = UDim2.new(1, 0, 0, 30)
    TopBar.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    TopBar.Parent = MainFrame

    local Title = Instance.new("TextLabel")
    Title.Size = UDim2.new(1, -40, 1, 0)
    Title.Position = UDim2.new(0, 10, 0, 0)
    Title.BackgroundTransparency = 1
    Title.Text = "KotowAC Terminal"
    Title.TextColor3 = Color3.fromRGB(200, 200, 200)
    Title.Font = Enum.Font.Code
    Title.TextSize = 14
    Title.TextXAlignment = Enum.TextXAlignment.Left
    Title.Parent = TopBar

    local CloseButton = Instance.new("TextButton")
    CloseButton.Size = UDim2.new(0, 30, 0, 30)
    CloseButton.Position = UDim2.new(1, -30, 0, 0)
    CloseButton.BackgroundTransparency = 1
    CloseButton.Text = "X"
    CloseButton.TextColor3 = Color3.fromRGB(255, 100, 100)
    CloseButton.Font = Enum.Font.Code
    CloseButton.TextSize = 16
    CloseButton.Parent = TopBar
    
    CloseButton.MouseButton1Click:Connect(function()
        ScreenGui:Destroy()
    end)

    local ScrollingFrame = Instance.new("ScrollingFrame")
    ScrollingFrame.Size = UDim2.new(1, 0, 1, -70)
    ScrollingFrame.Position = UDim2.new(0, 0, 0, 30)
    ScrollingFrame.BackgroundTransparency = 1
    ScrollingFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
    ScrollingFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
    ScrollingFrame.ScrollBarThickness = 4
    ScrollingFrame.Parent = MainFrame

    local UIListLayout = Instance.new("UIListLayout")
    UIListLayout.Padding = UDim.new(0, 4)
    UIListLayout.Parent = ScrollingFrame

    local InputFrame = Instance.new("Frame")
    InputFrame.Size = UDim2.new(1, 0, 0, 40)
    InputFrame.Position = UDim2.new(0, 0, 1, -40)
    InputFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
    InputFrame.Parent = MainFrame

    local Prompt = Instance.new("TextLabel")
    Prompt.Size = UDim2.new(0, 30, 1, 0)
    Prompt.BackgroundTransparency = 1
    Prompt.Text = "$"
    Prompt.TextColor3 = Color3.fromRGB(0, 255, 0)
    Prompt.Font = Enum.Font.Code
    Prompt.TextSize = 18
    Prompt.Parent = InputFrame

    local InputBox = Instance.new("TextBox")
    InputBox.Size = UDim2.new(1, -30, 1, 0)
    InputBox.Position = UDim2.new(0, 30, 0, 0)
    InputBox.BackgroundTransparency = 1
    InputBox.Text = ""
    InputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
    InputBox.Font = Enum.Font.Code
    InputBox.TextSize = 16
    InputBox.TextXAlignment = Enum.TextXAlignment.Left
    InputBox.ClearTextOnFocus = false
    InputBox.Parent = InputFrame

    local function addLine(text, color)
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, -10, 0, 20)
        label.Position = UDim2.new(0, 5, 0, 0)
        label.BackgroundTransparency = 1
        label.Text = text
        label.TextColor3 = color or Color3.fromRGB(255, 255, 255)
        label.Font = Enum.Font.Code
        label.TextSize = 15
        label.TextXAlignment = Enum.TextXAlignment.Left
        label.TextWrapped = true
        label.Parent = ScrollingFrame
    end

    addLine("KotowAC Linux v1.0 (Offline)", Color3.fromRGB(0, 255, 0))
    addLine("Type 'help' for commands.", Color3.fromRGB(150, 150, 150))

    InputBox.FocusLost:Connect(function(enterPressed)
        if enterPressed then
            local cmd = InputBox.Text
            InputBox.Text = ""
            
            addLine(current_path .. " $ " .. cmd, Color3.fromRGB(0, 255, 255))
            
            if cmd == "clear" then
                for _, child in ipairs(ScrollingFrame:GetChildren()) do
                    if child:IsA("TextLabel") then child:Destroy() end
                end
                addLine("KotowAC Linux v1.0", Color3.fromRGB(0, 255, 0))
            else
                local result = Terminal.Execute(cmd)
                if result and result ~= "" then
                    addLine(result, Color3.fromRGB(255, 255, 255))
                end
            end
            ScrollingFrame.CanvasPosition = Vector2.new(0, ScrollingFrame.AbsoluteCanvasSize.Y)
        end
    end)

    UserInputService.InputBegan:Connect(function(input, gameProcessed)
        if gameProcessed then return end
        if input.KeyCode == Enum.KeyCode.Up then
            if history_index > 1 then
                history_index = history_index - 1
                InputBox.Text = history[history_index]
            end
        elseif input.KeyCode == Enum.KeyCode.Down then
            if history_index < #history then
                history_index = history_index + 1
                InputBox.Text = history[history_index]
            else
                history_index = #history + 1
                InputBox.Text = ""
            end
        end
    end)
end

return Terminal