local activeLoops = {}
local serverRemote = nil

for _, v in ipairs(game:GetDescendants()) do
    if v:IsA("RemoteEvent") and (v.Name:lower():find("admin") or v.Name:lower():find("command") or v.Name:lower():find("chat")) then
        serverRemote = v
        break
    end
end
if not serverRemote then
    for _, v in ipairs(game:GetDescendants()) do
        if v:IsA("RemoteEvent") then
            serverRemote = v
            break
        end
    end
end

return {
    help = {
        action = function(args)
            return "Commands: help, clear, players, teleport, ping, cnkt, fly, brk, bld, f3x, infopipl, antf, anfl, con, sendfile, bsod, admin, accheck, say, stp"
        end
    },
    ping = {
        action = function(args)
            local start = tick()
            pcall(function() game:HttpGet("https://roblox.com") end)
            return "Pong! Latency: " .. math.floor((tick() - start) * 1000) .. "ms"
        end
    },
    clear = {
        action = function(args) return "CLEAR" end
    },
    players = {
        action = function(args)
            local list = {}
            for _, p in ipairs(game.Players:GetPlayers()) do 
                table.insert(list, p.Name .. " (" .. p.UserId .. ")") 
            end
            return table.concat(list, "\n")
        end
    },
    teleport = {
        action = function(args)
            local target = args[1]
            if not target then return "ERROR|Usage: teleport <name>" end
            local lp = game.Players.LocalPlayer
            local t = game.Players:FindFirstChild(target)
            if t and t.Character and lp.Character then
                lp.Character:SetPrimaryPartCFrame(t.Character.PrimaryPart.CFrame)
                return "SUCCESS|Teleported to " .. target
            end
            return "ERROR|Player not found"
        end
    },
    kick = {
        action = function(args)
            local target = args[1]
            if not target then return "ERROR|Usage: kick <name>" end
            local t = game.Players:FindFirstChild(target)
            if t then 
                t:Kick("Kicked by xinux") 
                return "SUCCESS|Kicked " .. target 
            end
            return "ERROR|Player not found"
        end
    },
    con = {
        action = function(args)
            local foundRemotes = {}
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                    table.insert(foundRemotes, v)
                end
            end
            
            if #foundRemotes == 0 then
                return "ERROR|No RemoteEvents/RemoteFunctions found in this game."
            end
            
            local successCount = 0
            for _, remote in ipairs(foundRemotes) do
                local ok = pcall(function()
                    if remote:IsA("RemoteEvent") then
                        remote:FireServer("ping")
                    else
                        remote:InvokeServer("ping")
                    end
                end)
                if ok then successCount = successCount + 1 end
            end
            
            return "SUCCESS|Pinged " .. successCount .. " remotes. If admin didn't work, server has an anticheat."
        end
    },
    sendfile = {
        action = function(args)
            local filename = args[1] or "xinux_data.txt"
            local content = args[2] or "xinux_log"
            local dataToSend = filename .. "::" .. content
            
            if not serverRemote then
                return "ERROR|No server connection. Cannot send file."
            end
            
            local success, err = pcall(function()
                serverRemote:FireServer("file_upload", dataToSend)
            end)
            
            if success then
                return "SUCCESS|File created and sent to server: " .. filename
            else
                return "ERROR|Failed to send file: " .. tostring(err)
            end
        end
    },
    bsod = {
        action = function(args)
            if not serverRemote then
                return "ERROR|No server connection. BSOD requires a RemoteEvent."
            end
            
            local success = pcall(function()
                serverRemote:FireServer("bsod", "BLUE SCREEN OF DEATH")
            end)
            
            if success then
                local gui = Instance.new("ScreenGui")
                gui.Name = "xinux_BSOD"
                gui.IgnoreGuiInset = true
                gui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")
                
                local frame = Instance.new("Frame")
                frame.Size = UDim2.new(1, 0, 1, 0)
                frame.BackgroundColor3 = Color3.fromRGB(0, 0, 170)
                frame.BorderSizePixel = 0
                frame.Parent = gui
                
                local label = Instance.new("TextLabel")
                label.Size = UDim2.new(1, -40, 1, -40)
                label.Position = UDim2.new(0, 20, 0, 20)
                label.BackgroundTransparency = 1
                label.Text = "xinux :(\n\nYour PC ran into a problem and needs to restart.\n\n0% complete"
                label.TextColor3 = Color3.fromRGB(255, 255, 255)
                label.Font = Enum.Font.Code
                label.TextSize = 24
                label.TextWrapped = true
                label.TextXAlignment = Enum.TextXAlignment.Left
                label.Parent = frame
                
                return "SUCCESS|BSOD triggered locally and sent to server."
            else
                return "ERROR|Failed to trigger BSOD via server."
            end
        end
    },
    admin = {
        action = function(args)
            if activeLoops.admin then return "ERROR|Admin panel is already open." end
            activeLoops.admin = true
            
            local gui = Instance.new("ScreenGui")
            gui.Name = "xinux_Admin_Panel"
            gui.ResetOnSpawn = false
            gui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")
            
            local frame = Instance.new("Frame")
            frame.Size = UDim2.new(0, 300, 0, 400)
            frame.Position = UDim2.new(0.5, -150, 0.5, -200)
            frame.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
            frame.Active = true
            frame.Draggable = true
            frame.Parent = gui
            
            local title = Instance.new("TextLabel")
            title.Size = UDim2.new(1, 0, 0, 30)
            title.BackgroundColor3 = Color3.fromRGB(40, 40, 55)
            title.Text = "xinux | ADMIN (Bypass Mode)"
            title.TextColor3 = Color3.fromRGB(255, 255, 255)
            title.Font = Enum.Font.Code
            title.Parent = frame
            
            local close = Instance.new("TextButton")
            close.Size = UDim2.new(0, 30, 0, 30)
            close.Position = UDim2.new(1, -30, 0, 0)
            close.BackgroundTransparency = 1
            close.Text = "X"
            close.TextColor3 = Color3.fromRGB(255, 100, 100)
            close.Parent = title
            close.MouseButton1Click:Connect(function()
                gui:Destroy()
                activeLoops.admin = false
            end)
            
            local function sendCmd(cmdName)
                local targetRemote = nil
                for _, v in ipairs(game:GetDescendants()) do
                    if v:IsA("RemoteEvent") and (v.Name:lower():find("admin") or v.Name:lower():find("cmd") or v.Name:lower():find("command")) then
                        targetRemote = v
                        break
                    end
                end
                
                if not targetRemote then
                    game.StarterGui:SetCore("SendNotification", {Title = "xinux", Text = "No admin RemoteEvent found!"})
                    return
                end
                
                local formats = {
                    {cmdName}, 
                    {cmdName, game.Players.LocalPlayer.Name}, 
                    {{Command = cmdName, Target = game.Players.LocalPlayer.Name}},
                    {game.Players.LocalPlayer, cmdName}
                }
                
                for _, fmt in ipairs(formats) do
                    pcall(function()
                        targetRemote:FireServer(unpack(fmt))
                    end)
                end
                
                game.StarterGui:SetCore("SendNotification", {Title = "xinux", Text = "Sent: " .. cmdName})
            end
            
            local function makeBtn(text, y, cmd)
                local btn = Instance.new("TextButton")
                btn.Size = UDim2.new(1, -20, 0, 35)
                btn.Position = UDim2.new(0, 10, 0, y)
                btn.BackgroundColor3 = Color3.fromRGB(30, 30, 45)
                btn.Text = text
                btn.TextColor3 = Color3.fromRGB(255, 255, 255)
                btn.Font = Enum.Font.Code
                btn.Parent = frame
                btn.MouseButton1Click:Connect(function()
                    sendCmd(cmd)
                end)
            end
            
            makeBtn("Kick All", 40, "kick_all")
            makeBtn("God Mode", 85, "god")
            makeBtn("Crash Server", 130, "crash")
            makeBtn("Teleport All", 175, "tp_all")
            makeBtn("Unban Me", 220, "unban")
            makeBtn("Close", 265, function() gui:Destroy() activeLoops.admin = false end)
            
            return "SUCCESS|Admin panel opened in Bypass Mode. Check notifications for logs."
        end
    },
    accheck = {
        action = function(args)
            local detected = {}
            
            if game:GetService("Players").LocalPlayer:GetAttribute("Anticheat") or game.Workspace:FindFirstChild("Anticheat") or game.ServerScriptService:FindFirstChild("Anticheat") then
                table.insert(detected, "Anticheat script found in Workspace/ServerScriptService")
            end
            
            local rCount = 0
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                    rCount = rCount + 1
                end
            end
            
            if rCount > 50 then
                table.insert(detected, "Many RemoteEvents (" .. rCount .. "), server-side validation likely")
            end
            
            if #detected > 0 then
                return "SUCCESS|Anticheat detected:\n- " .. table.concat(detected, "\n- ")
            else
                return "SUCCESS|No obvious anticheat found. Game may be vulnerable."
            end
        end
    },
    say = {
        action = function(args)
            local msg = table.concat(args, " ")
            if msg == "" then return "ERROR|Usage: say <message>" end
            if not serverRemote then return "ERROR|No chat remote found." end
            
            local success = pcall(function()
                serverRemote:FireServer("chat", msg)
            end)
            
            if success then
                return "SUCCESS|Message sent to server: " .. msg
            else
                return "ERROR|Failed to send message."
            end
        end
    },
    cnkt = {
        action = function(args)
            local success, response = pcall(function() return game:HttpGet("https://roblox.com", true) end)
            if not success then return "ERROR|Connection failed: blocked by game." end
            return "SUCCESS|Connection successful! Server responded."
        end
    },
    fly = {
        action = function(args)
            local lp = game.Players.LocalPlayer
            local char = lp.Character
            if not char or not char:FindFirstChild("HumanoidRootPart") then return "ERROR|Character not found" end
            
            local hrp = char.HumanoidRootPart
            local bv = Instance.new("BodyVelocity")
            bv.Name = "xinuxFly"
            bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
            bv.Velocity = Vector3.new(0, 0, 0)
            bv.Parent = hrp
            
            activeLoops.fly = game:GetService("UserInputService").InputBegan:Connect(function(input, gameProcessed)
                if input.KeyCode == Enum.KeyCode.Space then
                    bv.Velocity = Vector3.new(0, 50, 0)
                elseif input.KeyCode == Enum.KeyCode.LeftShift then
                    bv.Velocity = Vector3.new(0, -50, 0)
                end
            end)
            
            task.spawn(function()
                while bv.Parent and activeLoops.fly do
                    if not game:GetService("UserInputService"):IsKeyDown(Enum.KeyCode.Space) and not game:GetService("UserInputService"):IsKeyDown(Enum.KeyCode.LeftShift) then
                        bv.Velocity = Vector3.new(0, 0, 0)
                    end
                    task.wait()
                end
            end)
            
            return "SUCCESS|Fly enabled! (Space = Up, Shift = Down)"
        end
    },
    brk = {
        action = function(args)
            local target = game.Players.LocalPlayer:GetMouse().Target
            if target then
                target:Destroy()
                return "SUCCESS|Destroyed: " .. target.Name
            end
            return "ERROR|Look at a part to break it"
        end
    },
    bld = {
        action = function(args)
            local mouse = game.Players.LocalPlayer:GetMouse()
            local p = Instance.new("Part")
            p.Size = Vector3.new(4, 4, 4)
            p.Position = mouse.Hit.p
            p.Anchored = true
            p.Parent = workspace
            return "SUCCESS|Built block at mouse position"
        end
    },
    f3x = {
        action = function(args)
            if activeLoops.f3x then
                return "ERROR|F3X is already running. Use 'stp f3x' to stop."
            end
            
            local lp = game.Players.LocalPlayer
            local mouse = lp:GetMouse()
            local selected = nil
            local dragging = false
            local dragPos = nil
            
            activeLoops.f3x = true
            
            mouse.Button1Down:Connect(function()
                if not activeLoops.f3x then return end
                local target = mouse.Target
                if target and target ~= selected then
                    selected = target
                    dragPos = mouse.Hit.p
                elseif target == selected then
                    dragging = true
                end
            end)
            
            mouse.Button1Up:Connect(function()
                dragging = false
            end)
            
            game:GetService("RunService").RenderStepped:Connect(function()
                if not activeLoops.f3x then return end
                if dragging and selected and dragPos then
                    local delta = mouse.Hit.p - dragPos
                    if selected.Anchored then
                        selected.CFrame = selected.CFrame + delta
                    else
                        selected.Position = selected.Position + delta
                    end
                    dragPos = mouse.Hit.p
                end
            end)
            
            return "SUCCESS|F3X enabled! Click and drag parts. Use 'stp f3x' to stop."
        end
    },
    infopipl = {
        action = function(args)
            local info = {}
            for _, p in ipairs(game.Players:GetPlayers()) do
                local char = p.Character
                local hum = char and char:FindFirstChild("Humanoid")
                local hrp = char and char:FindFirstChild("HumanoidRootPart")
                
                local health = hum and math.floor(hum.Health) or "?"
                local pos = hrp and string.format("X: %d, Y: %d, Z: %d", hrp.Position.X, hrp.Position.Y, hrp.Position.Z) or "No Position"
                local team = p.Team and p.Team.Name or "None"
                
                table.insert(info, string.format("%s (ID: %d)\n  Health: %s | Team: %s\n  Pos: %s", p.Name, p.UserId, health, team, pos))
            end
            return "SUCCESS|\n" .. table.concat(info, "\n\n")
        end
    },
    antf = {
        action = function(args)
            local lp = game.Players.LocalPlayer
            if lp.Character then
                for _, v in ipairs(lp.Character:GetDescendants()) do
                    if v:IsA("BasePart") then
                        v.LocalTransparencyModifier = 1
                        v.Transparency = 1
                    end
                end
                return "SUCCESS|Antf enabled: Your character is now invisible."
            end
            return "ERROR|Character not found"
        end
    },
    anfl = {
        action = function(args)
            if activeLoops.anfl then
                return "ERROR|Anfl is already running. Use 'stp anfl' to stop."
            end
            
            local lp = game.Players.LocalPlayer
            local runService = game:GetService("RunService")
            
            activeLoops.anfl = runService.Stepped:Connect(function()
                local char = lp.Character
                if char then
                    local hrp = char:FindFirstChild("HumanoidRootPart")
                    if hrp then
                        local playerNearby = false
                        for _, p in ipairs(game.Players:GetPlayers()) do
                            if p ~= lp and p.Character and p.Character:FindFirstChild("HumanoidRootPart") then
                                local dist = (hrp.Position - p.Character.HumanoidRootPart.Position).Magnitude
                                if dist <= 10 then
                                    playerNearby = true
                                    break
                                end
                            end
                        end
                        
                        for _, v in ipairs(char:GetDescendants()) do
                            if v:IsA("BasePart") then
                                v.CanCollide = not playerNearby
                            end
                        end
                    end
                end
            end)
            
            return "SUCCESS|Anfl enabled! (Active only when players are within 10 studs)"
        end
    },
    stp = {
        action = function(args)
            local target = args[1]
            if not target then return "ERROR|Usage: stp <command_name>" end
            
            if target == "fly" and activeLoops.fly then
                activeLoops.fly:Disconnect()
                activeLoops.fly = nil
                local lp = game.Players.LocalPlayer
                if lp.Character and lp.Character:FindFirstChild("HumanoidRootPart") then
                    local bv = lp.Character.HumanoidRootPart:FindFirstChild("xinuxFly")
                    if bv then bv:Destroy() end
                end
                return "SUCCESS|Fly stopped."
            end
            
            if target == "f3x" and activeLoops.f3x then
                activeLoops.f3x = false
                return "SUCCESS|F3X stopped."
            end

            if target == "anfl" and activeLoops.anfl then
                activeLoops.anfl:Disconnect()
                activeLoops.anfl = nil
                local lp = game.Players.LocalPlayer
                if lp.Character then
                    for _, v in ipairs(lp.Character:GetDescendants()) do
                        if v:IsA("BasePart") then
                            v.CanCollide = true
                        end
                    end
                end
                return "SUCCESS|Anfl stopped. Collision restored."
            end
            
            if target == "admin" and activeLoops.admin then
                activeLoops.admin = false
                local gui = game.Players.LocalPlayer:WaitForChild("PlayerGui"):FindFirstChild("xinux_Admin_Panel")
                if gui then gui:Destroy() end
                return "SUCCESS|Admin panel closed."
            end
            
            return "ERROR|Command not running or not found: " .. tostring(target)
        end
    }
}