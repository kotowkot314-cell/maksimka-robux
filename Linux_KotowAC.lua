--[[
Linux_KotowAC v2.0 - Studio Plugin
Author: Maxxi1mka (kotowkot314-cell)
Purpose: Linux terminal emulator for Roblox Studio (developer only)
]]

local HttpService = game:GetService("HttpService")

local toolbar = plugin:CreateToolbar("KotowAC")
local button = toolbar:CreateButton("Terminal", "Open Linux Terminal", "rbxassetid://1234567890")

local SERVER_URL = "https://Maxxi1mka.pythonanywhere.com/terminal"

local widgetInfo = DockWidgetPluginGuiInfo.new(
    Enum.InitialDockState.Float,
    false,
    false,
    600,
    400,
    300,
    200
)

local widget = plugin:CreateDockWidgetPluginGui("KotowAC_Terminal", widgetInfo)
widget.Title = "Linux_KotowAC v2.0"

local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(1, 0, 1, 0)
MainFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
MainFrame.BorderSizePixel = 0
MainFrame.Parent = widget

local ScrollingFrame = Instance.new("ScrollingFrame")
ScrollingFrame.Size = UDim2.new(1, 0, 1, -40)
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
    label.BackgroundTransparency = 1
    label.Text = text
    label.TextColor3 = color or Color3.fromRGB(255, 255, 255)
    label.Font = Enum.Font.Code
    label.TextSize = 15
    label.TextXAlignment = Enum.TextXAlignment.Left
    label.TextWrapped = true
    label.Parent = ScrollingFrame
end

addLine("Linux_KotowAC v2.0", Color3.fromRGB(0, 255, 0))
addLine("Type 'help' for commands.", Color3.fromRGB(150, 150, 150))

local function sendCommand(cmd)
    local payload = HttpService:JSONEncode({command = cmd})
    local success, response = pcall(function()
        return HttpService:PostAsync(SERVER_URL, payload, Enum.HttpContentType.ApplicationJson)
    end)
    
    if success then
        local ok, data = pcall(function()
            return HttpService:JSONDecode(response)
        end)
        if ok and data and data.output then
            addLine(data.output, Color3.fromRGB(255, 255, 255))
        else
            addLine(response, Color3.fromRGB(255, 255, 255))
        end
    else
        addLine("Connection error: " .. tostring(response), Color3.fromRGB(255, 100, 100))
    end
end

InputBox.FocusLost:Connect(function(enterPressed)
    if enterPressed then
        local cmd = InputBox.Text
        if cmd == "" then return end
        InputBox.Text = ""
        addLine("$ " .. cmd, Color3.fromRGB(0, 255, 255))
        sendCommand(cmd)
        task.wait()
        ScrollingFrame.CanvasPosition = Vector2.new(0, ScrollingFrame.AbsoluteCanvasSize.Y)
    end
end)

button.Click:Connect(function()
    widget.Enabled = not widget.Enabled
end)