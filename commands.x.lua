local activeLoops = {}

return {
    help = {
        action = function(args)
            return "Commands: help, clear, players, teleport, ping, cnkt, fly, brk, bld, f3x, infopipl, antf, anfl, con, stp"
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
    cnkt = {
        action = function(args)
            local success, response = pcall(function() return game:HttpGet("https://roblox.com", true) end)
            if not success then return "Connection failed: blocked by game." end
            return "Connection successful! Server responded."
        end
    },
    con = {
        action = function(args)
            local foundRemote = nil
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                    foundRemote = v
                    break
                end
            end
            
            if not foundRemote then
                return "Server connection failed: No RemoteEvents found in this game."
            end
            
            local success, err = pcall(function()
                if foundRemote:IsA("RemoteEvent") then
                    foundRemote:FireServer("xinux_ping")
                else
                    foundRemote:InvokeServer("xinux_ping")
                end
            end)
            
            if success then
                return "Server connection successful! Game allows client calls."
            else
                return "Server connection failed: Game/Anticheat blocked the request."
            end
        end
    },
    fly = {
        action = function(args)
            local lp = game.Players.LocalPlayer
            local char = lp.Character
            if not char or not char:FindFirstChild("HumanoidRootPart") then return "Character not found" end
            
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
            
            return "Fly enabled! (Space = Up, Shift = Down)"
        end
    },
    brk = {
        action = function(args)
            local target = game.Players.LocalPlayer:GetMouse().Target
            if target then
                target:Destroy()
                return "Destroyed: " .. target.Name
            end
            return "Look at a part to break it"
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
            return "Built block at mouse position"
        end
    },
    f3x = {
        action = function(args)
            if activeLoops.f3x then
                return "F3X is already running. Use 'stp f3x' to stop."
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
            
            return "F3X enabled! Click and drag parts. Use 'stp f3x' to stop."
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
            return table.concat(info, "\n\n")
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
                return "Antf enabled: Your character is now invisible."
            end
            return "Character not found"
        end
    },
    anfl = {
        action = function(args)
            if activeLoops.anfl then
                return "Anfl is already running. Use 'stp anfl' to stop."
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
            
            return "Anfl enabled! (Active only when players are within 10 studs)"
        end
    },
    stp = {
        action = function(args)
            local target = args[1]
            if not target then return "Usage: stp <command_name> (e.g., stp fly)" end
            
            if target == "fly" and activeLoops.fly then
                activeLoops.fly:Disconnect()
                activeLoops.fly = nil
                local lp = game.Players.LocalPlayer
                if lp.Character and lp.Character:FindFirstChild("HumanoidRootPart") then
                    local bv = lp.Character.HumanoidRootPart:FindFirstChild("xinuxFly")
                    if bv then bv:Destroy() end
                end
                return "Fly stopped."
            end
            
            if target == "f3x" and activeLoops.f3x then
                activeLoops.f3x = false
                return "F3X stopped."
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
                return "Anfl stopped. Collision restored."
            end
            
            return "Command not running or not found: " .. tostring(target)
        end
    }
}