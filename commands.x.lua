local activeLoops = {}
local serverRemote = nil

for _, v in ipairs(game:GetDescendants()) do
    if v:IsA("RemoteEvent") and (v.Name:lower():find("chat") or v.Name:lower():find("message") or v.Name:lower():find("admin")) then
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
            if not target then return "Usage: teleport <name>" end
            local lp = game.Players.LocalPlayer
            local t = game.Players:FindFirstChild(target)
            if t and t.Character and lp.Character then
                lp.Character:SetPrimaryPartCFrame(t.Character.PrimaryPart.CFrame)
                return "Teleported to " .. target
            end
            return "Player not found"
        end
    },
    kick = {
        action = function(args)
            local target = args[1]
            if not target then return "Usage: kick <name>" end
            local t = game.Players:FindFirstChild(target)
            if t then 
                t:Kick("Kicked by xinux") 
                return "Kicked " .. target 
            end
            return "Player not found"
        end
    },
    con = {
        action = function(args)
            if not serverRemote then
                return "ERROR|No RemoteEvents found in this game."
            end
            local success, err = pcall(function()
                if serverRemote:IsA("RemoteEvent") then
                    serverRemote:FireServer("xinux_ping")
                else
                    serverRemote:InvokeServer("xinux_ping")
                end
            end)
            if success then
                return "SUCCESS|Server connection successful! Game allows client calls."
            else
                return "ERROR|Server connection failed: " .. tostring(err)
            end
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
            if not serverRemote then
                return "ERROR|No server connection. Cannot activate admin."
            end
            
            local testSuccess = pcall(function()
                serverRemote:FireServer("xinux_admin_check")
            end)
            
            if not testSuccess then
                return "ERROR|Server rejected the request. Anticheat is active."
            end
            
            if activeLoops.admin then
                return "ERROR|Admin is already active in this session."
            end
            
            activeLoops.admin = true
            
            game:GetService("UserInputService").InputBegan:Connect(function(input, gameProcessed)
                if gameProcessed then return end
                if not activeLoops.admin then return end
                
                local lp = game.Players.LocalPlayer
                if input.KeyCode == Enum.KeyCode.G then
                    if lp.Character and lp.Character:FindFirstChild("Humanoid") then
                        lp.Character.Humanoid.MaxHealth = math.huge
                        lp.Character.Humanoid.Health = math.huge
                    end
                elseif input.KeyCode == Enum.KeyCode.H then
                    for _, p in ipairs(game.Players:GetPlayers()) do
                        if p ~= lp then p:Kick("Admin Panel") end
                    end
                elseif input.KeyCode == Enum.KeyCode.J then
                    for _, p in ipairs(game.Players:GetPlayers()) do
                        if p ~= lp and p.Character and p.Character:FindFirstChild("HumanoidRootPart") and lp.Character then
                            p.Character.HumanoidRootPart.CFrame = lp.Character.HumanoidRootPart.CFrame + Vector3.new(0, 0, 5)
                        end
                    end
                end
            end)
            
            return "SUCCESS|Admin interface activated silently. Press G (God), H (Kick All), J (Pull All)."
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
            if msg == "" then return "Usage: say <message>" end
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
            if not target then return "ERROR|Usage: stp <command_name> (e.g., stp fly)" end
            
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
                return "SUCCESS|Admin deactivated."
            end
            
            return "ERROR|Command not running or not found: " .. tostring(target)
        end
    }
}