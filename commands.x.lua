return {
    help = {
        action = function(args)
            return "Commands: help, clear, players, kick, teleport, ping, cnkt, fly, brk, bld"
        end
    },
    ping = {
        action = function(args)
            local start = tick()
            pcall(function()
                game:HttpGet("https://roblox.com")
            end)
            local finish = tick()
            return "Pong! Latency: " .. math.floor((finish - start) * 1000) .. "ms"
        end
    },
    clear = {
        action = function(args)
            return "CLEAR"
        end
    },
    players = {
        action = function(args)
            local Players = game:GetService("Players")
            local list = {}
            for _, p in ipairs(Players:GetPlayers()) do 
                table.insert(list, p.Name .. " (" .. p.UserId .. ")") 
            end
            return table.concat(list, "\n")
        end
    },
    teleport = {
        action = function(args)
            local target = args[1]
            if not target then return "Usage: teleport <name>" end
            local Players = game:GetService("Players")
            local lp = Players.LocalPlayer
            local t = Players:FindFirstChild(target)
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
            local Players = game:GetService("Players")
            local t = Players:FindFirstChild(target)
            if t then 
                t:Kick("Kicked by xinux") 
                return "Kicked " .. target 
            end
            return "Player not found"
        end
    },
    cnkt = {
        action = function(args)
            local success, response = pcall(function()
                return game:HttpGet("https://roblox.com", true)
            end)
            if not success then
                return "Connection failed: HTTP request failed (blocked by game/executor)."
            end
            if not response or response == "" then
                return "Connection failed: No response from server (nil)."
            end
            return "Connection successful! Server responded."
        end
    },
    fly = {
        action = function(args)
            local Players = game:GetService("Players")
            local RunService = game:GetService("RunService")
            local UIS = game:GetService("UserInputService")
            local lp = Players.LocalPlayer
            local char = lp.Character
            
            if not char or not char:FindFirstChild("HumanoidRootPart") then
                return "Character not found"
            end
            
            local hrp = char.HumanoidRootPart
            local bv = Instance.new("BodyVelocity")
            bv.Name = "xinuxFly"
            bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
            bv.Velocity = Vector3.new(0, 0, 0)
            bv.Parent = hrp
            
            local flying = true
            
            UIS.InputBegan:Connect(function(input, gameProcessed)
                if not flying then return end
                if input.KeyCode == Enum.KeyCode.Space then
                    bv.Velocity = Vector3.new(0, 50, 0)
                elseif input.KeyCode == Enum.KeyCode.LeftShift then
                    bv.Velocity = Vector3.new(0, -50, 0)
                end
            end)
            
            UIS.InputEnded:Connect(function(input, gameProcessed)
                if not flying then return end
                if input.KeyCode == Enum.KeyCode.Space or input.KeyCode == Enum.KeyCode.LeftShift then
                    bv.Velocity = Vector3.new(0, 0, 0)
                end
            end)
            
            task.spawn(function()
                while flying and bv.Parent do
                    if not UIS:IsKeyDown(Enum.KeyCode.Space) and not UIS:IsKeyDown(Enum.KeyCode.LeftShift) then
                        bv.Velocity = Vector3.new(0, 0, 0)
                    end
                    task.wait()
                end
            end)
            
            return "Fly enabled! Hold Space to go UP, Left Shift to go DOWN."
        end
    },
    brk = {
        action = function(args)
            local mouse = game.Players.LocalPlayer:GetMouse()
            local target = mouse.Target
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
            local pos = mouse.Hit.p
            local p = Instance.new("Part")
            p.Size = Vector3.new(4, 4, 4)
            p.Position = pos
            p.Anchored = true
            p.Parent = workspace
            return "Built block at mouse position"
        end
    }
}