local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")
local UserInputService = game:GetService("UserInputService")

local COMMANDS_URL = "https://raw.githubusercontent.com/kotowkot314-cell/maksimka-robux/main/commands.x.lua"

local executorName = "Unknown"
local httpFunc = nil
local FS = {
    writefile = nil,
    readfile = nil,
    listfiles = nil,
    isfile = nil,
    isfolder = nil,
    makefolder = nil,
    delfile = nil,
    delfolder = nil,
}

pcall(function()
    if identifyexecutor then
        executorName = identifyexecutor()
    elseif getexecutorname then
        executorName = getexecutorname()
    end
end)

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

local function tryGet(name, ...)
    local candidates = {name, ...}
    for _, n in ipairs(candidates) do
        local ok, fn = pcall(function() return getfenv()[n] or _G[n] end)
        if ok and type(fn) == "function" then return fn end
    end
    return nil
end

FS.writefile  = tryGet("writefile", "writefileasync")
FS.readfile   = tryGet("readfile")
FS.listfiles  = tryGet("listfiles")
FS.isfile     = tryGet("isfile")
FS.isfolder   = tryGet("isfolder")
FS.makefolder = tryGet("makefolder", "makedir")
FS.delfile    = tryGet("delfile", "deletefile")
FS.delfolder  = tryGet("delfolder", "deletedir")

local hasFS = FS.writefile and FS.readfile and FS.listfiles and FS.makefolder

local ROOT = "xinux/"
local cwd = ROOT

local function ensureRoot()
    if not hasFS then return false end
    if not FS.isfolder(ROOT) then
        FS.makefolder(ROOT)
    end
    if not FS.isfile(ROOT .. "welcome.txt") then
        FS.writefile(ROOT .. "welcome.txt", "Welcome to xinux!\nType help to see commands.")
    end
    return true
end

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "xinux_Terminal"
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
ScreenGui.Parent = PlayerGui

local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(0, 620, 0, 420)
MainFrame.Position = UDim2.new(0.5, -310, 0.5, -210)
MainFrame.BackgroundColor3 = Color3.fromRGB(18, 18, 26)
MainFrame.BorderSizePixel = 0
MainFrame.Active = true
MainFrame.Draggable = true
MainFrame.Parent = ScreenGui
Instance.new("UICorner", MainFrame).CornerRadius = UDim.new(0, 6)

local Stroke = Instance.new("UIStroke")
Stroke.Color = Color3.fromRGB(50, 50, 70)
Stroke.Thickness = 1
Stroke.Parent = MainFrame

local TopBar = Instance.new("Frame")
TopBar.Size = UDim2.new(1, 0, 0, 28)
TopBar.BackgroundColor3 = Color3.fromRGB(32, 32, 45)
TopBar.BorderSizePixel = 0
TopBar.Parent = MainFrame

local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, -40, 1, 0)
Title.Position = UDim2.new(0, 12, 0, 0)
Title.BackgroundTransparency = 1
Title.Text = "xinux"
Title.TextColor3 = Color3.fromRGB(220, 220, 230)
Title.Font = Enum.Font.Code
Title.TextSize = 14
Title.TextXAlignment = Enum.TextXAlignment.Left
Title.Parent = TopBar

local CloseButton = Instance.new("TextButton")
CloseButton.Size = UDim2.new(0, 28, 0, 28)
CloseButton.Position = UDim2.new(1, -28, 0, 0)
CloseButton.BackgroundTransparency = 1
CloseButton.Text = "×"
CloseButton.TextColor3 = Color3.fromRGB(255, 90, 90)
CloseButton.Font = Enum.Font.Code
CloseButton.TextSize = 18
CloseButton.Parent = TopBar
CloseButton.MouseButton1Click:Connect(function()
    ScreenGui:Destroy()
end)

local ScrollingFrame = Instance.new("ScrollingFrame")
ScrollingFrame.Size = UDim2.new(1, -12, 1, -68)
ScrollingFrame.Position = UDim2.new(0, 6, 0, 34)
ScrollingFrame.BackgroundTransparency = 1
ScrollingFrame.CanvasSize = UDim2.new(0, 0, 0, 0)
ScrollingFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
ScrollingFrame.ScrollBarThickness = 4
ScrollingFrame.ScrollBarImageColor3 = Color3.fromRGB(80, 80, 100)
ScrollingFrame.Parent = MainFrame

local ListLayout = Instance.new("UIListLayout")
ListLayout.Padding = UDim.new(0, 1)
ListLayout.Parent = ScrollingFrame

local InputFrame = Instance.new("Frame")
InputFrame.Size = UDim2.new(1, 0, 0, 32)
InputFrame.Position = UDim2.new(0, 0, 1, -32)
InputFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
InputFrame.BorderSizePixel = 0
InputFrame.Parent = MainFrame

local Prompt = Instance.new("TextLabel")
Prompt.Size = UDim2.new(0, 140, 1, 0)
Prompt.Position = UDim2.new(0, 8, 0, 0)
Prompt.BackgroundTransparency = 1
Prompt.Text = "[xinux]$"
Prompt.TextColor3 = Color3.fromRGB(0, 220, 120)
Prompt.Font = Enum.Font.Code
Prompt.TextSize = 14
Prompt.TextXAlignment = Enum.TextXAlignment.Left
Prompt.Parent = InputFrame

local InputBox = Instance.new("TextBox")
InputBox.Size = UDim2.new(1, -155, 1, 0)
InputBox.Position = UDim2.new(0, 145, 0, 0)
InputBox.BackgroundTransparency = 1
InputBox.Text = ""
InputBox.TextColor3 = Color3.fromRGB(240, 240, 245)
InputBox.Font = Enum.Font.Code
InputBox.TextSize = 14
InputBox.TextXAlignment = Enum.TextXAlignment.Left
InputBox.ClearTextOnFocus = false
InputBox.Parent = InputFrame

local history = {}
local historyIndex = 0
local customCommands = {}

local function addLine(text, color)
    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, -8, 0, 16)
    label.BackgroundTransparency = 1
    label.Text = tostring(text)
    label.TextColor3 = color or Color3.fromRGB(210, 210, 220)
    label.Font = Enum.Font.Code
    label.TextSize = 13
    label.TextXAlignment = Enum.TextXAlignment.Left
    label.TextWrapped = true
    label.Parent = ScrollingFrame
end

local function processOutput(text)
    if type(text) \~= "string" then text = tostring(text) end
    if text:sub(1, 8) == "SUCCESS|" then
        addLine(text:sub(9), Color3.fromRGB(0, 220, 120))
    elseif text:sub(1, 6) == "ERROR|" then
        addLine(text:sub(7), Color3.fromRGB(255, 90, 90))
    elseif text == "CLEAR" then
        for _, child in ipairs(ScrollingFrame:GetChildren()) do
            if child:IsA("TextLabel") then child:Destroy() end
        end
    else
        for line in text:gmatch("[^\r\n]+") do
            addLine(line)
        end
    end
end

local function updatePrompt()
    local short = cwd:gsub("^xinux/", ""):gsub("/$", "")
    if short == "" then short = "\~" end
    Prompt.Text = "[xinux:" .. short .. "]$"
end

task.spawn(function()
    ensureRoot()

    addLine("xinux v2", Color3.fromRGB(0, 220, 120))
    if hasFS then
        addLine("Filesystem: ONLINE  (root = xinux/)", Color3.fromRGB(0, 200, 100))
    else
        addLine("Filesystem: OFFLINE", Color3.fromRGB(255, 160, 50))
    end
    addLine("")

    local loaded = false

    if httpFunc then
        local ok, resp = pcall(function()
            return httpFunc({Url = COMMANDS_URL, Method = "GET"})
        end)
        if ok and resp and resp.Body then
            local fn, err = loadstring(resp.Body)
            if fn then
                local success, result = pcall(fn)
                if success and type(result) == "table" then
                    customCommands = result
                    loaded = true
                    addLine("[OK] Commands loaded", Color3.fromRGB(0, 220, 120))
                end
            end
        end
    end

    if not loaded then
        local ok, body = pcall(function() return game:HttpGet(COMMANDS_URL) end)
        if ok and body then
            local fn = loadstring(body)
            if fn then
                local success, result = pcall(fn)
                if success and type(result) == "table" then
                    customCommands = result
                    loaded = true
                    addLine("[OK] Commands loaded", Color3.fromRGB(0, 220, 120))
                end
            end
        end
    end

    if not loaded and hasFS and FS.isfile(ROOT .. "commands.x.lua") then
        local ok, body = pcall(FS.readfile, ROOT .. "commands.x.lua")
        if ok and body then
            local fn = loadstring(body)
            if fn then
                local success, result = pcall(fn)
                if success and type(result) == "table" then
                    customCommands = result
                    loaded = true
                    addLine("[OK] Commands loaded from local file", Color3.fromRGB(0, 220, 120))
                end
            end
        end
    end

    if not loaded then
        addLine("[ERR] Failed to load external commands", Color3.fromRGB(255, 90, 90))
        addLine("Upload commands.x.lua to GitHub or put it in xinux/ folder", Color3.fromRGB(255, 160, 50))
    end

    addLine("Type 'help' for list of commands")
    addLine("")
    updatePrompt()
end)

InputBox.FocusLost:Connect(function(enter)
    if not enter then return end
    local text = InputBox.Text
    if text == "" then return end

    InputBox.Text = ""
    table.insert(history, text)
    historyIndex = #history + 1

    addLine(Prompt.Text .. " " .. text, Color3.fromRGB(0, 200, 120))

    local parts = {}
    for word in text:gmatch("%S+") do
        table.insert(parts, word)
    end
    local cmd = parts[1] and parts[1]:lower()
    table.remove(parts, 1)
    local args = parts

    if cmd == "clear" or cmd == "cls" then
        processOutput("CLEAR")
        return
    end

    if customCommands[cmd] then
        task.spawn(function()
            local ok, result = pcall(function()
                return customCommands[cmd].action(args, {
                    FS = FS,
                    hasFS = hasFS,
                    cwd = cwd,
                    setCwd = function(new) cwd = new end,
                    ROOT = ROOT,
                    addLine = addLine,
                    processOutput = processOutput
                })
            end)
            if ok then
                processOutput(tostring(result or ""))
            else
                processOutput("ERROR|" .. tostring(result))
            end
            updatePrompt()
            task.wait()
            ScrollingFrame.CanvasPosition = Vector2.new(0, ScrollingFrame.AbsoluteCanvasSize.Y)
        end)
    else
        processOutput("ERROR|" .. tostring(cmd) .. ": command not found")
    end
end)

UserInputService.InputBegan:Connect(function(input, gp)
    if gp then return end
    if input.KeyCode == Enum.KeyCode.Up and InputBox:IsFocused() then
        if historyIndex > 1 then
            historyIndex = historyIndex - 1
            InputBox.Text = history[historyIndex] or ""
            InputBox.CursorPosition = #InputBox.Text + 1
        end
    elseif input.KeyCode == Enum.KeyCode.Down and InputBox:IsFocused() then
        if historyIndex < #history then
            historyIndex = historyIndex + 1
            InputBox.Text = history[historyIndex] or ""
        else
            historyIndex = #history + 1
            InputBox.Text = ""
        end
    end
end)