return {
    help = {
        action = function(args)
            return "Commands: help, clear, players, kick, teleport, ping, cnkt, fly"
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
            local lp = game.Players.LocalPlayer
            local char = lp.Character
            if char and char:FindFirstChild("HumanoidRootPart") then
                local bp = Instance.new("BodyVelocity")
                bp.MaxForce = Vector3.new(1e9, 1e9, 1e9)
                bp.Velocity = Vector3.new(0, 0, 0)
                bp.Parent = char.HumanoidRootPart
                return "Fly enabled (drag yourself up)."
            end
            return "Character not found"
        end
    }
}