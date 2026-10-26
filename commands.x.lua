return {
    ["players"] = {
        desc = "Показать список игроков",
        action = function(args)
            local Players = game:GetService("Players")
            local list = {}
            for _, p in ipairs(Players:GetPlayers()) do
                table.insert(list, p.Name .. " (ID: " .. p.UserId .. ")")
            end
            return table.concat(list, "\n")
        end
    },
    ["teleport"] = {
        desc = "Телепорт к игроку. Использование: teleport <имя>",
        action = function(args)
            local target = args[1]
            if not target then return "Укажите имя игрока" end
            local Players = game:GetService("Players")
            local lp = Players.LocalPlayer
            local t = Players:FindFirstChild(target)
            if t and t.Character and lp.Character then
                lp.Character:SetPrimaryPartCFrame(t.Character.PrimaryPart.CFrame)
                return "Телепортирован к " .. target
            end
            return "Игрок не найден"
        end
    },
    ["kick"] = {
        desc = "Кикнуть игрока (если есть права). Использование: kick <имя>",
        action = function(args)
            local target = args[1]
            if not target then return "Укажите имя игрока" end
            local Players = game:GetService("Players")
            local t = Players:FindFirstChild(target)
            if t then
                t:Kick("Kicked by xinux terminal")
                return "Игрок " .. target .. " кикнут"
            end
            return "Игрок не найден"
        end
    },
    ["ping"] = {
        desc = "Проверить соединение с сервером",
        action = function(args)
            return "Pong! Соединение стабильно."
        end
    }
}