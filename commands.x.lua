local activeLoops = {}

return {
    help = {
        action = function(args, ctx)
            return [[Commands:
ls cd pwd cat echo mkdir rm touch exec clear
players teleport ping fly speed jump god noclip
brk bld f3x antf anfl infopipl scan crash
accheck con say admin stp rejoin serverhop
esp unesp bring kill remotes fire invoke firespam
remotespy getremotes remoteinfo]]
        end
    },

    clear = {
        action = function() return "CLEAR" end
    },

    pwd = {
        action = function(args, ctx)
            return ctx.cwd
        end
    },

    ls = {
        action = function(args, ctx)
            if not ctx.hasFS then return "ERROR|Filesystem not available" end
            local path = ctx.cwd
            if args[1] then
                if args[1]:sub(1,1) == "/" then
                    path = ctx.ROOT .. args[1]:sub(2)
                else
                    path = ctx.cwd .. args[1]
                end
            end
            if not path:match("/$") then path = path .. "/" end
            local ok, files = pcall(ctx.FS.listfiles, path)
            if not ok or not files then return "ERROR|Cannot list directory" end
            if #files == 0 then return "(empty)" end
            local result = {}
            for _, f in ipairs(files) do
                local name = f:match("([^/]+)$") or f
                if ctx.FS.isfolder(f) then
                    table.insert(result, name .. "/")
                else
                    table.insert(result, name)
                end
            end
            table.sort(result)
            return table.concat(result, "\n")
        end
    },

    cd = {
        action = function(args, ctx)
            if not ctx.hasFS then return "ERROR|Filesystem not available" end
            local target = args[1]
            if not target or target == "~" or target == "/" then
                ctx.setCwd(ctx.ROOT)
                return "SUCCESS|" .. ctx.ROOT
            end
            local newPath
            if target == ".." then
                newPath = ctx.cwd:match("(.*/).*/") or ctx.ROOT
            elseif target:sub(1,1) == "/" then
                newPath = ctx.ROOT .. target:sub(2)
            else
                newPath = ctx.cwd .. target
            end
            if not newPath:match("/$") then newPath = newPath .. "/" end
            if not newPath:find(ctx.ROOT, 1, true) then
                return "ERROR|Access denied (outside xinux/)"
            end
            if ctx.FS.isfolder(newPath) then
                ctx.setCwd(newPath)
                return "SUCCESS|" .. newPath
            else
                return "ERROR|No such directory"
            end
        end
    },

    cat = {
        action = function(args, ctx)
            if not ctx.hasFS then return "ERROR|Filesystem not available" end
            if not args[1] then return "ERROR|Usage: cat <file>" end
            local path
            if args[1]:sub(1,1) == "/" then
                path = ctx.ROOT .. args[1]:sub(2)
            else
                path = ctx.cwd .. args[1]
            end
            if not ctx.FS.isfile(path) then return "ERROR|File not found" end
            local ok, content = pcall(ctx.FS.readfile, path)
            if ok then return content else return "ERROR|Cannot read file" end
        end
    },

    echo = {
        action = function(args, ctx)
            if not ctx.hasFS then return "ERROR|Filesystem not available" end
            if #args < 2 or args[#args-1] ~= ">" then
                return table.concat(args, " ")
            end
            local filename = args[#args]
            local content = table.concat(args, " ", 1, #args-2)
            local path = ctx.cwd .. filename
            local ok = pcall(ctx.FS.writefile, path, content)
            if ok then return "SUCCESS|Written to " .. filename else return "ERROR|Write failed" end
        end
    },

    mkdir = {
        action = function(args, ctx)
            if not ctx.hasFS then return "ERROR|Filesystem not available" end
            if not args[1] then return "ERROR|Usage: mkdir <name>" end
            local path = ctx.cwd .. args[1]
            if ctx.FS.isfolder(path) then return "ERROR|Already exists" end
            local ok = pcall(ctx.FS.makefolder, path)
            if ok then return "SUCCESS|Created " .. args[1] else return "ERROR|Failed to create folder" end
        end
    },

    rm = {
        action = function(args, ctx)
            if not ctx.hasFS then return "ERROR|Filesystem not available" end
            if not args[1] then return "ERROR|Usage: rm <file/folder>" end
            local path = ctx.cwd .. args[1]
            if ctx.FS.isfile(path) then
                local ok = pcall(ctx.FS.delfile, path)
                if ok then return "SUCCESS|Deleted file " .. args[1] else return "ERROR|Delete failed" end
            elseif ctx.FS.isfolder(path) then
                local ok = pcall(ctx.FS.delfolder, path)
                if ok then return "SUCCESS|Deleted folder " .. args[1] else return "ERROR|Delete failed" end
            else
                return "ERROR|Not found"
            end
        end
    },

    touch = {
        action = function(args, ctx)
            if not ctx.hasFS then return "ERROR|Filesystem not available" end
            if not args[1] then return "ERROR|Usage: touch <file>" end
            local path = ctx.cwd .. args[1]
            local ok = pcall(ctx.FS.writefile, path, "")
            if ok then return "SUCCESS|Created " .. args[1] else return "ERROR|Failed" end
        end
    },

    exec = {
        action = function(args, ctx)
            if not ctx.hasFS then return "ERROR|Filesystem not available" end
            if not args[1] then return "ERROR|Usage: exec <file.lua>" end
            local path = ctx.cwd .. args[1]
            if not ctx.FS.isfile(path) then return "ERROR|File not found" end
            local ok, content = pcall(ctx.FS.readfile, path)
            if not ok then return "ERROR|Cannot read file" end
            local fn, err = loadstring(content)
            if not fn then return "ERROR|Syntax error: " .. tostring(err) end
            local success, result = pcall(fn)
            if success then
                return "SUCCESS|Executed " .. args[1] .. (result and ("\n" .. tostring(result)) or "")
            else
                return "ERROR|" .. tostring(result)
            end
        end
    },

    ping = {
        action = function()
            local start = tick()
            pcall(function() game:HttpGet("https://roblox.com") end)
            return "Pong! " .. math.floor((tick() - start) * 1000) .. "ms"
        end
    },

    players = {
        action = function()
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
            if t and t.Character and lp.Character and lp.Character.PrimaryPart and t.Character.PrimaryPart then
                lp.Character:SetPrimaryPartCFrame(t.Character.PrimaryPart.CFrame)
                return "SUCCESS|Teleported to " .. target
            end
            return "ERROR|Player not found"
        end
    },

    fly = {
        action = function(args, ctx)
            local lp = game.Players.LocalPlayer
            local char = lp.Character
            if not char or not char:FindFirstChild("HumanoidRootPart") then return "ERROR|Character not found" end
            if activeLoops.fly then return "ERROR|Fly already enabled. Use stp fly" end
            local hrp = char.HumanoidRootPart
            local bv = Instance.new("BodyVelocity")
            bv.Name = "xinuxFly"
            bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
            bv.Velocity = Vector3.new(0, 0, 0)
            bv.Parent = hrp
            activeLoops.fly = game:GetService("UserInputService").InputBegan:Connect(function(input)
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
            return "SUCCESS|Fly enabled (Space = up, Shift = down)"
        end
    },

    speed = {
        action = function(args)
            local val = tonumber(args[1]) or 50
            local lp = game.Players.LocalPlayer
            if lp.Character and lp.Character:FindFirstChildOfClass("Humanoid") then
                lp.Character.Humanoid.WalkSpeed = val
                return "SUCCESS|WalkSpeed set to " .. val
            end
            return "ERROR|Character not found"
        end
    },

    jump = {
        action = function(args)
            local val = tonumber(args[1]) or 100
            local lp = game.Players.LocalPlayer
            if lp.Character and lp.Character:FindFirstChildOfClass("Humanoid") then
                lp.Character.Humanoid.JumpPower = val
                return "SUCCESS|JumpPower set to " .. val
            end
            return "ERROR|Character not found"
        end
    },

    god = {
        action = function()
            local lp = game.Players.LocalPlayer
            if not lp.Character then return "ERROR|Character not found" end
            local hum = lp.Character:FindFirstChildOfClass("Humanoid")
            if not hum then return "ERROR|Humanoid not found" end
            hum.MaxHealth = math.huge
            hum.Health = math.huge
            return "SUCCESS|Godmode enabled"
        end
    },

    noclip = {
        action = function()
            if activeLoops.noclip then
                activeLoops.noclip:Disconnect()
                activeLoops.noclip = nil
                local char = game.Players.LocalPlayer.Character
                if char then
                    for _, v in ipairs(char:GetDescendants()) do
                        if v:IsA("BasePart") then v.CanCollide = true end
                    end
                end
                return "SUCCESS|Noclip disabled"
            end
            activeLoops.noclip = game:GetService("RunService").Stepped:Connect(function()
                local char = game.Players.LocalPlayer.Character
                if char then
                    for _, v in ipairs(char:GetDescendants()) do
                        if v:IsA("BasePart") then v.CanCollide = false end
                    end
                end
            end)
            return "SUCCESS|Noclip enabled"
        end
    },

    brk = {
        action = function()
            local target = game.Players.LocalPlayer:GetMouse().Target
            if target then
                target:Destroy()
                return "SUCCESS|Destroyed: " .. target.Name
            end
            return "ERROR|Look at a part"
        end
    },

    bld = {
        action = function()
            local mouse = game.Players.LocalPlayer:GetMouse()
            local p = Instance.new("Part")
            p.Size = Vector3.new(4, 4, 4)
            p.Position = mouse.Hit.Position
            p.Anchored = true
            p.Parent = workspace
            return "SUCCESS|Built block"
        end
    },

    f3x = {
        action = function()
            if activeLoops.f3x then return "ERROR|F3X already running. Use stp f3x" end
            local lp = game.Players.LocalPlayer
            local mouse = lp:GetMouse()
            local selected, dragging, dragPos = nil, false, nil
            activeLoops.f3x = true
            mouse.Button1Down:Connect(function()
                if not activeLoops.f3x then return end
                local target = mouse.Target
                if target and target ~= selected then
                    selected = target
                    dragPos = mouse.Hit.Position
                elseif target == selected then
                    dragging = true
                end
            end)
            mouse.Button1Up:Connect(function() dragging = false end)
            game:GetService("RunService").RenderStepped:Connect(function()
                if not activeLoops.f3x then return end
                if dragging and selected and dragPos then
                    local delta = mouse.Hit.Position - dragPos
                    if selected:IsA("BasePart") then
                        if selected.Anchored then
                            selected.CFrame = selected.CFrame + delta
                        else
                            selected.Position = selected.Position + delta
                        end
                    end
                    dragPos = mouse.Hit.Position
                end
            end)
            return "SUCCESS|F3X enabled. Click and drag parts. stp f3x to stop"
        end
    },

    antf = {
        action = function()
            local lp = game.Players.LocalPlayer
            if not lp.Character then return "ERROR|Character not found" end
            for _, v in ipairs(lp.Character:GetDescendants()) do
                if v:IsA("BasePart") then
                    v.LocalTransparencyModifier = 1
                    v.Transparency = 1
                end
            end
            return "SUCCESS|Invisible enabled"
        end
    },

    anfl = {
        action = function()
            if activeLoops.anfl then return "ERROR|Already running. Use stp anfl" end
            local lp = game.Players.LocalPlayer
            activeLoops.anfl = game:GetService("RunService").Stepped:Connect(function()
                local char = lp.Character
                if not char then return end
                local hrp = char:FindFirstChild("HumanoidRootPart")
                if not hrp then return end
                local nearby = false
                for _, p in ipairs(game.Players:GetPlayers()) do
                    if p ~= lp and p.Character and p.Character:FindFirstChild("HumanoidRootPart") then
                        if (hrp.Position - p.Character.HumanoidRootPart.Position).Magnitude <= 10 then
                            nearby = true
                            break
                        end
                    end
                end
                for _, v in ipairs(char:GetDescendants()) do
                    if v:IsA("BasePart") then
                        v.CanCollide = not nearby
                    end
                end
            end)
            return "SUCCESS|Anfl enabled (noclip near players)"
        end
    },

    infopipl = {
        action = function()
            local info = {}
            for _, p in ipairs(game.Players:GetPlayers()) do
                local char = p.Character
                local hum = char and char:FindFirstChildOfClass("Humanoid")
                local hrp = char and char:FindFirstChild("HumanoidRootPart")
                local health = hum and math.floor(hum.Health) or "?"
                local pos = hrp and string.format("%.0f %.0f %.0f", hrp.Position.X, hrp.Position.Y, hrp.Position.Z) or "none"
                table.insert(info, string.format("%s | HP: %s | Pos: %s", p.Name, health, pos))
            end
            return table.concat(info, "\n")
        end
    },

    scan = {
        action = function()
            local found = {}
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                    table.insert(found, v:GetFullName())
                end
            end
            if #found == 0 then return "ERROR|No remotes found" end
            return "Found " .. #found .. " remotes:\n" .. table.concat(found, "\n")
        end
    },

    remotes = {
        action = function()
            local list = {}
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") then
                    table.insert(list, "[RemoteEvent] " .. v:GetFullName())
                elseif v:IsA("RemoteFunction") then
                    table.insert(list, "[RemoteFunction] " .. v:GetFullName())
                end
            end
            if #list == 0 then return "ERROR|No remotes found" end
            table.sort(list)
            return "Found " .. #list .. " remotes:\n" .. table.concat(list, "\n")
        end
    },

    fire = {
        action = function(args)
            if #args < 1 then return "ERROR|Usage: fire <RemoteName> [args...]" end
            local name = args[1]
            table.remove(args, 1)
            local remote = nil
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") and (v.Name == name or v:GetFullName():find(name)) then
                    remote = v
                    break
                end
            end
            if not remote then return "ERROR|Remote not found: " .. name end
            
            -- Конвертируем строки в числа, если это возможно
            local convertedArgs = {}
            for _, arg in ipairs(args) do
                local num = tonumber(arg)
                table.insert(convertedArgs, num or arg)
            end
            
            local ok, err = pcall(function()
                remote:FireServer(unpack(convertedArgs))
            end)
            if ok then
                return "SUCCESS|Fired " .. remote:GetFullName()
            else
                return "ERROR|" .. tostring(err)
            end
        end
    },

    invoke = {
        action = function(args)
            if #args < 1 then return "ERROR|Usage: invoke <RemoteName> [args...]" end
            local name = args[1]
            table.remove(args, 1)
            local remote = nil
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteFunction") and (v.Name == name or v:GetFullName():find(name)) then
                    remote = v
                    break
                end
            end
            if not remote then return "ERROR|RemoteFunction not found: " .. name end
            
            local convertedArgs = {}
            for _, arg in ipairs(args) do
                local num = tonumber(arg)
                table.insert(convertedArgs, num or arg)
            end
            
            local ok, result = pcall(function()
                return remote:InvokeServer(unpack(convertedArgs))
            end)
            if ok then
                return "SUCCESS|Result: " .. tostring(result)
            else
                return "ERROR|" .. tostring(result)
            end
        end
    },

    firespam = {
        action = function(args)
            if #args < 1 then return "ERROR|Usage: firespam <RemoteName> [times] [args...]" end
            local name = args[1]
            local times = tonumber(args[2]) or 50
            table.remove(args, 1)
            if tonumber(args[1]) then table.remove(args, 1) end
            local remote = nil
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") and (v.Name == name or v:GetFullName():find(name)) then
                    remote = v
                    break
                end
            end
            if not remote then return "ERROR|RemoteEvent not found" end
            
            local convertedArgs = {}
            for _, arg in ipairs(args) do
                local num = tonumber(arg)
                table.insert(convertedArgs, num or arg)
            end
            
            task.spawn(function()
                for i = 1, times do
                    pcall(function() remote:FireServer(unpack(convertedArgs)) end)
                    task.wait()
                end
            end)
            return "SUCCESS|Spamming " .. remote.Name .. " " .. times .. " times"
        end
    },

    remotespy = {
        action = function()
            if activeLoops.remotespy then
                activeLoops.remotespy = false
                return "SUCCESS|RemoteSpy disabled"
            end
            activeLoops.remotespy = true
            local mt = getrawmetatable(game)
            local oldNamecall = mt.__namecall
            setreadonly(mt, false)
            mt.__namecall = newcclosure(function(self, ...)
                local method = getnamecallmethod()
                if activeLoops.remotespy and (method == "FireServer" or method == "InvokeServer") then
                    local args = {...}
                    print("[xinux RemoteSpy]", self:GetFullName(), method, unpack(args))
                end
                return oldNamecall(self, ...)
            end)
            setreadonly(mt, true)
            return "SUCCESS|RemoteSpy enabled (check console/F9)"
        end
    },

    getremotes = {
        action = function(args)
            local filter = args[1] and args[1]:lower() or ""
            local result = {}
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                    local full = v:GetFullName()
                    if filter == "" or full:lower():find(filter) then
                        table.insert(result, v.ClassName .. " | " .. full)
                    end
                end
            end
            if #result == 0 then return "ERROR|Nothing found" end
            return table.concat(result, "\n")
        end
    },

    remoteinfo = {
        action = function(args)
            if not args[1] then return "ERROR|Usage: remoteinfo <name>" end
            local name = args[1]
            for _, v in ipairs(game:GetDescendants()) do
                if (v:IsA("RemoteEvent") or v:IsA("RemoteFunction")) and (v.Name == name or v:GetFullName():find(name)) then
                    return "Name: " .. v.Name .. "\nClass: " .. v.ClassName .. "\nFullName: " .. v:GetFullName() .. "\nParent: " .. tostring(v.Parent)
                end
            end
            return "ERROR|Remote not found"
        end
    },

    crash = {
        action = function()
            if activeLoops.crash then return "ERROR|Already running" end
            local targets = {}
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") then
                    table.insert(targets, v)
                end
            end
            if #targets == 0 then return "ERROR|No RemoteEvents" end
            activeLoops.crash = true
            for i = 1, 40 do
                task.spawn(function()
                    while activeLoops.crash do
                        for _, remote in ipairs(targets) do
                            pcall(function() remote:FireServer("lag") end)
                        end
                        task.wait()
                    end
                end)
            end
            task.delay(8, function() activeLoops.crash = false end)
            return "SUCCESS|Crash started (auto-stop 8s)"
        end
    },

    accheck = {
        action = function()
            local detected = {}
            local rCount = 0
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                    rCount = rCount + 1
                end
            end
            if rCount > 40 then
                table.insert(detected, "Many remotes (" .. rCount .. ")")
            end
            if game:GetService("Players").LocalPlayer:GetAttribute("Anticheat") then
                table.insert(detected, "Anticheat attribute found")
            end
            if #detected > 0 then
                return "Possible anticheat:\n- " .. table.concat(detected, "\n- ")
            end
            return "No obvious anticheat detected"
        end
    },

    con = {
        action = function()
            local remote = nil
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") then
                    remote = v
                    break
                end
            end
            if not remote then return "ERROR|No RemoteEvent found" end
            local ok = pcall(function() remote:FireServer("xinux_ping") end)
            if ok then return "SUCCESS|Remote responded" else return "ERROR|Failed to fire remote" end
        end
    },

    say = {
        action = function(args)
            local msg = table.concat(args, " ")
            if msg == "" then return "ERROR|Usage: say <message>" end
            local remote = nil
            for _, v in ipairs(game:GetDescendants()) do
                if v:IsA("RemoteEvent") and (v.Name:lower():find("chat") or v.Name:lower():find("message")) then
                    remote = v
                    break
                end
            end
            if not remote then return "ERROR|No chat remote found" end
            local ok = pcall(function() remote:FireServer(msg) end)
            if ok then return "SUCCESS|Sent" else return "ERROR|Failed" end
        end
    },

    admin = {
        action = function()
            if activeLoops.admin then return "ERROR|Already open" end
            activeLoops.admin = true
            local gui = Instance.new("ScreenGui")
            gui.Name = "xinux_Admin"
            gui.ResetOnSpawn = false
            gui.Parent = game.Players.LocalPlayer:WaitForChild("PlayerGui")
            local frame = Instance.new("Frame")
            frame.Size = UDim2.new(0, 280, 0, 320)
            frame.Position = UDim2.new(0.5, -140, 0.5, -160)
            frame.BackgroundColor3 = Color3.fromRGB(20, 20, 28)
            frame.Active = true
            frame.Draggable = true
            frame.Parent = gui
            Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 6)
            local title = Instance.new("TextLabel")
            title.Size = UDim2.new(1, 0, 0, 30)
            title.BackgroundColor3 = Color3.fromRGB(35, 35, 50)
            title.Text = "xinux admin"
            title.TextColor3 = Color3.fromRGB(255, 255, 255)
            title.Font = Enum.Font.Code
            title.Parent = frame
            local close = Instance.new("TextButton")
            close.Size = UDim2.new(0, 30, 0, 30)
            close.Position = UDim2.new(1, -30, 0, 0)
            close.BackgroundTransparency = 1
            close.Text = "X"
            close.TextColor3 = Color3.fromRGB(255, 90, 90)
            close.Parent = title
            close.MouseButton1Click:Connect(function()
                gui:Destroy()
                activeLoops.admin = false
            end)
            local function tryFire(cmd)
                for _, v in ipairs(game:GetDescendants()) do
                    if v:IsA("RemoteEvent") and (v.Name:lower():find("admin") or v.Name:lower():find("cmd") or v.Name:lower():find("command")) then
                        pcall(function() v:FireServer(cmd) end)
                        pcall(function() v:FireServer(cmd, game.Players.LocalPlayer.Name) end)
                        pcall(function() v:FireServer({Command = cmd}) end)
                    end
                end
            end
            local function btn(text, y, cmd)
                local b = Instance.new("TextButton")
                b.Size = UDim2.new(1, -20, 0, 32)
                b.Position = UDim2.new(0, 10, 0, y)
                b.BackgroundColor3 = Color3.fromRGB(35, 35, 50)
                b.Text = text
                b.TextColor3 = Color3.fromRGB(255, 255, 255)
                b.Font = Enum.Font.Code
                b.Parent = frame
                b.MouseButton1Click:Connect(function() tryFire(cmd) end)
            end
            btn("Kick All", 40, "kick_all")
            btn("Godmode", 80, "god")
            btn("Crash", 120, "crash")
            btn("TP All", 160, "tp_all")
            btn("Unban", 200, "unban")
            return "SUCCESS|Admin panel opened"
        end
    },

    rejoin = {
        action = function()
            game:GetService("TeleportService"):Teleport(game.PlaceId, game.Players.LocalPlayer)
            return "SUCCESS|Rejoining..."
        end
    },

    serverhop = {
        action = function()
            local Http = game:GetService("HttpService")
            local TPS = game:GetService("TeleportService")
            local ok, servers = pcall(function()
                return Http:JSONDecode(game:HttpGet("https://games.roblox.com/v1/games/" .. game.PlaceId .. "/servers/Public?sortOrder=Asc&limit=100"))
            end)
            if not ok or not servers or not servers.data then return "ERROR|Failed to get servers" end
            for _, server in ipairs(servers.data) do
                if server.playing < server.maxPlayers and server.id ~= game.JobId then
                    TPS:TeleportToPlaceInstance(game.PlaceId, server.id, game.Players.LocalPlayer)
                    return "SUCCESS|Server hopping..."
                end
            end
            return "ERROR|No other servers found"
        end
    },

    esp = {
        action = function()
            if activeLoops.esp then return "ERROR|ESP already enabled. Use unesp" end
            activeLoops.esp = true
            local function addEsp(plr)
                if plr == game.Players.LocalPlayer then return end
                local char = plr.Character
                if not char then return end
                local hrp = char:FindFirstChild("HumanoidRootPart")
                if not hrp then return end
                local highlight = Instance.new("Highlight")
                highlight.Name = "xinuxESP"
                highlight.FillColor = Color3.fromRGB(0, 255, 100)
                highlight.OutlineColor = Color3.fromRGB(0, 200, 80)
                highlight.FillTransparency = 0.5
                highlight.Parent = char
            end
            for _, p in ipairs(game.Players:GetPlayers()) do
                addEsp(p)
                p.CharacterAdded:Connect(function()
                    task.wait(1)
                    addEsp(p)
                end)
            end
            game.Players.PlayerAdded:Connect(function(p)
                p.CharacterAdded:Connect(function()
                    task.wait(1)
                    addEsp(p)
                end)
            end)
            return "SUCCESS|ESP enabled"
        end
    },

    unesp = {
        action = function()
            activeLoops.esp = false
            for _, p in ipairs(game.Players:GetPlayers()) do
                if p.Character then
                    local h = p.Character:FindFirstChild("xinuxESP")
                    if h then h:Destroy() end
                end
            end
            return "SUCCESS|ESP disabled"
        end
    },

    bring = {
        action = function(args)
            local target = args[1]
            if not target then return "ERROR|Usage: bring <name>" end
            local lp = game.Players.LocalPlayer
            local t = game.Players:FindFirstChild(target)
            if t and t.Character and lp.Character and lp.Character.PrimaryPart and t.Character.PrimaryPart then
                t.Character:SetPrimaryPartCFrame(lp.Character.PrimaryPart.CFrame)
                return "SUCCESS|Brought " .. target
            end
            return "ERROR|Player not found"
        end
    },

    kill = {
        action = function(args)
            local target = args[1]
            if not target then return "ERROR|Usage: kill <name>" end
            local t = game.Players:FindFirstChild(target)
            if t and t.Character then
                local hum = t.Character:FindFirstChildOfClass("Humanoid")
                if hum then
                    hum.Health = 0
                    return "SUCCESS|Killed " .. target
                end
            end
            return "ERROR|Player not found"
        end
    },

    stp = {
        action = function(args)
            local target = args[1]
            if not target then return "ERROR|Usage: stp <name>" end
            if target == "fly" and activeLoops.fly then
                activeLoops.fly:Disconnect()
                activeLoops.fly = nil
                local hrp = game.Players.LocalPlayer.Character and game.Players.LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                if hrp then
                    local bv = hrp:FindFirstChild("xinuxFly")
                    if bv then bv:Destroy() end
                end
                return "SUCCESS|Fly stopped"
            end
            if target == "f3x" then
                activeLoops.f3x = false
                return "SUCCESS|F3X stopped"
            end
            if target == "anfl" and activeLoops.anfl then
                activeLoops.anfl:Disconnect()
                activeLoops.anfl = nil
                local char = game.Players.LocalPlayer.Character
                if char then
                    for _, v in ipairs(char:GetDescendants()) do
                        if v:IsA("BasePart") then v.CanCollide = true end
                    end
                end
                return "SUCCESS|Anfl stopped"
            end
            if target == "crash" then
                activeLoops.crash = false
                return "SUCCESS|Crash stopped"
            end
            if target == "admin" then
                activeLoops.admin = false
                local gui = game.Players.LocalPlayer.PlayerGui:FindFirstChild("xinux_Admin")
                if gui then gui:Destroy() end
                return "SUCCESS|Admin closed"
            end
            if target == "noclip" and activeLoops.noclip then
                activeLoops.noclip:Disconnect()
                activeLoops.noclip = nil
                local char = game.Players.LocalPlayer.Character
                if char then
                    for _, v in ipairs(char:GetDescendants()) do
                        if v:IsA("BasePart") then v.CanCollide = true end
                    end
                end
                return "SUCCESS|Noclip stopped"
            end
            return "ERROR|Not running: " .. target
        end
    }
}