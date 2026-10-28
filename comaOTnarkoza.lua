srv = {
    action = function()
        local ws = workspace
        local stats = {
            "=== SERVER INFO ===",
            "PlaceId: " .. game.PlaceId,
            "GameId: " .. game.GameId,
            "JobId: " .. game.JobId,
            "Creator: " .. tostring(game.CreatorId),
            "Players: " .. #game.Players:GetPlayers() .. "/" .. game.Players.MaxPlayers,
            "Workspace children: " .. #ws:GetChildren(),
            "Workspace descendants: " .. #ws:GetDescendants(),
            "Server time: " .. os.date("%Y-%m-%d %H:%M:%S"),
            "FPS: " .. math.floor(1 / math.max(workspace:GetRealPhysicsFPS(), 1e-6) * 0 + workspace:GetRealPhysicsFPS()),
            "Uptime(s): " .. math.floor(workspace.DistributedGameTime),
        }
        return table.concat(stats, "\n")
    end
},

parts = {
    action = function(args)
        local filter = args[1] and args[1]:lower() or ""
        local map = {}
        local total = 0
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                total = total + 1
                local cls = v.ClassName
                if filter == "" or cls:lower():find(filter) then
                    map[cls] = (map[cls] or 0) + 1
                end
            end
        end
        local lines = { "Total BaseParts: " .. total }
        local keys = {}
        for k in pairs(map) do table.insert(keys, k) end
        table.sort(keys)
        for _, k in ipairs(keys) do
            table.insert(lines, string.format("%-24s %d", k, map[k]))
        end
        if #lines == 1 then table.insert(lines, "(no matches)") end
        return table.concat(lines, "\n")
    end
},

blocks = {
    action = function(args)
        local filter = args[1] and args[1]:lower() or ""
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                local cls = v.ClassName
                if filter == "" or cls:lower():find(filter) then
                    map[cls] = (map[cls] or 0) + 1
                end
            end
        end
        local lines = {}
        local keys = {}
        for k in pairs(map) do table.insert(keys, k) end
        table.sort(keys)
        for _, k in ipairs(keys) do
            table.insert(lines, k .. ": " .. map[k])
        end
        if #lines == 0 then return "No blocks found" end
        return table.concat(lines, "\n")
    end
},

blockinfo = {
    action = function()
        local target = game.Players.LocalPlayer:GetMouse().Target
        if not target then return "ERROR|Look at a part" end
        local lines = {
            "Name: " .. target.Name,
            "Class: " .. target.ClassName,
            "FullName: " .. target:GetFullName(),
            "Position: " .. tostring(target.Position),
            "Size: " .. tostring(target.Size),
            "CFrame: " .. tostring(target.CFrame),
            "Anchored: " .. tostring(target.Anchored),
            "CanCollide: " .. tostring(target.CanCollide),
            "Transparency: " .. tostring(target.Transparency),
            "Color: " .. tostring(target.Color),
            "Material: " .. tostring(target.Material),
            "Massless: " .. tostring(target.Massless),
            "Parent: " .. tostring(target.Parent and target.Parent:GetFullName()),
        }
        return table.concat(lines, "\n")
    end
},

partinfo = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: partinfo <name>" end
        local name = args[1]
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and (v.Name == name or v:GetFullName():find(name)) then
                local lines = {
                    "Name: " .. v.Name,
                    "Class: " .. v.ClassName,
                    "FullName: " .. v:GetFullName(),
                    "Position: " .. tostring(v.Position),
                    "Size: " .. tostring(v.Size),
                    "CFrame: " .. tostring(v.CFrame),
                    "Anchored: " .. tostring(v.Anchored),
                    "CanCollide: " .. tostring(v.CanCollide),
                    "Transparency: " .. tostring(v.Transparency),
                    "Color: " .. tostring(v.Color),
                    "Material: " .. tostring(v.Material),
                    "Parent: " .. tostring(v.Parent and v.Parent:GetFullName()),
                }
                return table.concat(lines, "\n")
            end
        end
        return "ERROR|Part not found"
    end
},

find = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: find <text> [limit]" end
        local text = args[1]:lower()
        local limit = tonumber(args[2]) or 100
        local found, count = {}, 0
        for _, v in ipairs(game:GetDescendants()) do
            if v.Name:lower():find(text, 1, true) then
                count = count + 1
                if #found < limit then
                    table.insert(found, v.ClassName .. " | " .. v:GetFullName())
                end
            end
        end
        if count == 0 then return "Nothing found" end
        local head = "Found " .. count .. " (showing " .. #found .. "):\n"
        return head .. table.concat(found, "\n")
    end
},

findclass = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: findclass <ClassName> [limit]" end
        local cls = args[1]
        local limit = tonumber(args[2]) or 100
        local found, count = {}, 0
        for _, v in ipairs(game:GetDescendants()) do
            if v.ClassName == cls then
                count = count + 1
                if #found < limit then
                    table.insert(found, v:GetFullName())
                end
            end
        end
        if count == 0 then return "Nothing found" end
        return "Found " .. count .. ":\n" .. table.concat(found, "\n")
    end
},

scripts = {
    action = function(args)
        local filter = args[1] and args[1]:lower() or ""
        local found, count = {}, 0
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("Script") or v:IsA("LocalScript") or v:IsA("ModuleScript") then
                local full = v:GetFullName()
                if filter == "" or full:lower():find(filter) then
                    count = count + 1
                    if #found < 200 then
                        table.insert(found, v.ClassName .. " | " .. full)
                    end
                end
            end
        end
        if count == 0 then return "No scripts" end
        return "Scripts: " .. count .. "\n" .. table.concat(found, "\n")
    end
},

scriptinfo = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: scriptinfo <name>" end
        local name = args[1]
        for _, v in ipairs(game:GetDescendants()) do
            if (v:IsA("Script") or v:IsA("LocalScript") or v:IsA("ModuleScript")) and (v.Name == name or v:GetFullName():find(name)) then
                local lines = {
                    "Name: " .. v.Name,
                    "Class: " .. v.ClassName,
                    "FullName: " .. v:GetFullName(),
                    "Parent: " .. tostring(v.Parent and v.Parent:GetFullName()),
                    "Source: " .. (v.Source and v.Source:sub(1, 4000) or "n/a"),
                }
                return table.concat(lines, "\n")
            end
        end
        return "ERROR|Script not found"
    end
},

dump = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: dump <name> [depth]" end
        local name = args[1]
        local depth = tonumber(args[2]) or 2
        for _, v in ipairs(game:GetDescendants()) do
            if v.Name == name or v:GetFullName():find(name) then
                local lines = {}
                local function walk(obj, d, prefix)
                    table.insert(lines, prefix .. obj.ClassName .. " | " .. obj.Name)
                    if d >= depth then return end
                    for _, c in ipairs(obj:GetChildren()) do
                        walk(c, d + 1, prefix .. "  ")
                    end
                end
                walk(v, 0, "")
                return table.concat(lines, "\n")
            end
        end
        return "ERROR|Not found"
    end
},

children = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: children <name>" end
        local name = args[1]
        for _, v in ipairs(game:GetDescendants()) do
            if v.Name == name or v:GetFullName():find(name) then
                local lines = {}
                for _, c in ipairs(v:GetChildren()) do
                    table.insert(lines, c.ClassName .. " | " .. c.Name)
                end
                if #lines == 0 then return "(no children)" end
                return table.concat(lines, "\n")
            end
        end
        return "ERROR|Not found"
    end
},

props = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: props <name>" end
        local name = args[1]
        for _, v in ipairs(game:GetDescendants()) do
            if v.Name == name or v:GetFullName():find(name) then
                local lines = {}
                for _, p in ipairs(v:GetChildren()) do
                    table.insert(lines, p.ClassName .. " | " .. p.Name)
                end
                table.insert(lines, 1, "ClassName: " .. v.ClassName)
                table.insert(lines, 2, "Name: " .. v.Name)
                return table.concat(lines, "\n")
            end
        end
        return "ERROR|Not found"
    end
},

sounds = {
    action = function(args)
        local filter = args[1] and args[1]:lower() or ""
        local found, count = {}, 0
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("Sound") then
                local full = v:GetFullName()
                if filter == "" or full:lower():find(filter) then
                    count = count + 1
                    if #found < 200 then
                        table.insert(found, full .. " | playing=" .. tostring(v.IsPlaying))
                    end
                end
            end
        end
        if count == 0 then return "No sounds" end
        return "Sounds: " .. count .. "\n" .. table.concat(found, "\n")
    end
},

gui = {
    action = function(args)
        local filter = args[1] and args[1]:lower() or ""
        local found, count = {}, 0
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("ScreenGui") or v:IsA("BillboardGui") or v:IsA("SurfaceGui") then
                local full = v:GetFullName()
                if filter == "" or full:lower():find(filter) then
                    count = count + 1
                    if #found < 200 then
                        table.insert(found, v.ClassName .. " | " .. full)
                    end
                end
            end
        end
        if count == 0 then return "No GUIs" end
        return "GUIs: " .. count .. "\n" .. table.concat(found, "\n")
    end
},

tools = {
    action = function()
        local lines = {}
        for _, p in ipairs(game.Players:GetPlayers()) do
            local backpack = p:FindFirstChild("Backpack")
            if backpack then
                for _, t in ipairs(backpack:GetChildren()) do
                    if t:IsA("Tool") then
                        table.insert(lines, p.Name .. " | " .. t.Name)
                    end
                end
            end
        end
        if #lines == 0 then return "No tools" end
        return table.concat(lines, "\n")
    end
},

playerinfo = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: playerinfo <name>" end
        local p = game.Players:FindFirstChild(args[1])
        if not p then return "ERROR|Player not found" end
        local lines = {
            "Name: " .. p.Name,
            "DisplayName: " .. p.DisplayName,
            "UserId: " .. p.UserId,
            "AccountAge: " .. p.AccountAge .. " days",
            "Team: " .. (p.Team and p.Team.Name or "-"),
            "Character: " .. tostring(p.Character and p.Character.Name),
            "FollowUserId: " .. tostring(p.FollowUserId),
            "MembershipType: " .. tostring(p.MembershipType),
        }
        local char = p.Character
        if char then
            local hum = char:FindFirstChildOfClass("Humanoid")
            local hrp = char:FindFirstChild("HumanoidRootPart")
            if hum then
                table.insert(lines, "Health: " .. hum.Health .. "/" .. hum.MaxHealth)
                table.insert(lines, "WalkSpeed: " .. hum.WalkSpeed)
                table.insert(lines, "JumpPower: " .. hum.JumpPower)
            end
            if hrp then
                table.insert(lines, "Position: " .. tostring(hrp.Position))
            end
            local count = 0
            for _, v in ipairs(char:GetDescendants()) do
                if v:IsA("BasePart") then count = count + 1 end
            end
            table.insert(lines, "Parts: " .. count)
        end
        return table.concat(lines, "\n")
    end
},

alltitles = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and v.Name:lower():find("title") then
                table.insert(lines, v:GetFullName() .. " | " .. tostring(v.Position))
            end
        end
        if #lines == 0 then return "No titles" end
        return table.concat(lines, "\n")
    end
},

vehicles = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("VehicleSeat") or v.Name:lower():find("car") or v.Name:lower():find("vehicle") then
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
            end
        end
        if #lines == 0 then return "No vehicles" end
        return table.concat(lines, "\n")
    end
},

checkpoints = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and (v.Name:lower():find("checkpoint") or v.Name:lower():find("spawn")) then
                table.insert(lines, v:GetFullName() .. " | " .. tostring(v.Position))
            end
        end
        if #lines == 0 then return "No checkpoints" end
        return table.concat(lines, "\n")
    end
},

npcs = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Model") then
                local hum = v:FindFirstChildOfClass("Humanoid")
                if hum and not game.Players:GetPlayerFromCharacter(v) then
                    table.insert(lines, v.Name .. " | HP: " .. math.floor(hum.Health) .. "/" .. math.floor(hum.MaxHealth))
                end
            end
        end
        if #lines == 0 then return "No NPCs" end
        return table.concat(lines, "\n")
    end
},

lights = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Light") then
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName() .. " | b=" .. tostring(v.Brightness))
            end
        end
        if #lines == 0 then return "No lights" end
        return table.concat(lines, "\n")
    end
},

effects = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("ParticleEmitter") or v:IsA("Fire") or v:IsA("Smoke") or v:IsA("Sparkles") or v:IsA("Beam") or v:IsA("Trail") then
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
            end
        end
        if #lines == 0 then return "No effects" end
        return table.concat(lines, "\n")
    end
},

jointscan = {
    action = function()
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("JointInstance") or v:IsA("Weld") or v:IsA("Motor6D") or v:IsA("HingeConstraint") or v:IsA("BallSocketConstraint") then
                map[v.ClassName] = (map[v.ClassName] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        if #lines == 0 then return "No joints" end
        return table.concat(lines, "\n")
    end
},

terraininfo = {
    action = function()
        local t = workspace:FindFirstChildOfClass("Terrain")
        if not t then return "No Terrain" end
        local lines = {
            "Terrain size: " .. tostring(t.Size),
            "Water wave height: " .. tostring(t.WaterWaveHeight),
            "Water wave speed: " .. tostring(t.WaterWaveSpeed),
            "Decoration: " .. tostring(t.Decoration),
        }
        return table.concat(lines, "\n")
    end
},

region = {
    action = function(args)
        if #args < 6 then return "ERROR|Usage: region <x1> <y1> <z1> <x2> <y2> <z2>" end
        local x1, y1, z1 = tonumber(args[1]), tonumber(args[2]), tonumber(args[3])
        local x2, y2, z2 = tonumber(args[4]), tonumber(args[5]), tonumber(args[6])
        if not (x1 and y1 and z1 and x2 and y2 and z2) then return "ERROR|Bad numbers" end
        local minx, maxx = math.min(x1,x2), math.max(x1,x2)
        local miny, maxy = math.min(y1,y2), math.max(y1,y2)
        local minz, maxz = math.min(z1,z2), math.max(z1,z2)
        local lines, count = {}, 0
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                local p = v.Position
                if p.X >= minx and p.X <= maxx and p.Y >= miny and p.Y <= maxy and p.Z >= minz and p.Z <= maxz then
                    count = count + 1
                    if #lines < 200 then
                        table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
                    end
                end
            end
        end
        if count == 0 then return "Empty region" end
        return "Parts in region: " .. count .. "\n" .. table.concat(lines, "\n")
    end
},

near = {
    action = function(args)
        local radius = tonumber(args[1]) or 20
        local lp = game.Players.LocalPlayer
        local char = lp.Character
        local hrp = char and char:FindFirstChild("HumanoidRootPart")
        if not hrp then return "ERROR|Character not found" end
        local center = hrp.Position
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and v ~= hrp then
                local d = (v.Position - center).Magnitude
                if d <= radius then
                    table.insert(lines, string.format("%.1f | %s | %s", d, v.ClassName, v:GetFullName()))
                end
            end
        end
        if #lines == 0 then return "Nothing nearby" end
        table.sort(lines)
        return table.concat(lines, "\n")
    end
},

modelinfo = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: modelinfo <name>" end
        local name = args[1]
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Model") and (v.Name == name or v:GetFullName():find(name)) then
                local parts, mass = 0, 0
                for _, c in ipairs(v:GetDescendants()) do
                    if c:IsA("BasePart") then
                        parts = parts + 1
                        mass = mass + c:GetMass()
                    end
                end
                local prim = v.PrimaryPart
                return table.concat({
                    "Name: " .. v.Name,
                    "FullName: " .. v:GetFullName(),
                    "Parts: " .. parts,
                    "Total mass: " .. string.format("%.2f", mass),
                    "PrimaryPart: " .. tostring(prim and prim.Name),
                    "Position: " .. (prim and tostring(prim.Position) or "n/a"),
                }, "\n")
            end
        end
        return "ERROR|Model not found"
    end
},

spawnpoint = {
    action = function()
        local sp = workspace:FindFirstChildOfClass("SpawnLocation")
        if not sp then return "No SpawnLocation" end
        return "SpawnLocation: " .. sp:GetFullName() .. "\nPos: " .. tostring(sp.Position)
    end
},

baseparts_by_material = {
    action = function()
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                local m = tostring(v.Material)
                map[m] = (map[m] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        table.sort(lines)
        if #lines == 0 then return "No parts" end
        return table.concat(lines, "\n")
    end
},

baseparts_by_color = {
    action = function()
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                local c = v.Color
                local key = string.format("%d,%d,%d", math.floor(c.R*255), math.floor(c.G*255), math.floor(c.B*255))
                map[key] = (map[key] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        if #lines == 0 then return "No parts" end
        return table.concat(lines, "\n")
    end
},

baseparts_by_size = {
    action = function()
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                local s = v.Size
                local key = string.format("%.0fx%.0fx%.0f", s.X, s.Y, s.Z)
                map[key] = (map[key] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        if #lines == 0 then return "No parts" end
        return table.concat(lines, "\n")
    end
},

anchored_check = {
    action = function()
        local anchored, unanchored = 0, 0
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                if v.Anchored then anchored = anchored + 1 else unanchored = unanchored + 1 end
            end
        end
        return "Anchored: " .. anchored .. "\nUnanchored: " .. unanchored
    end
},

collidable_check = {
    action = function()
        local col, notcol = 0, 0
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                if v.CanCollide then col = col + 1 else notcol = notcol + 1 end
            end
        end
        return "CanCollide true: " .. col .. "\nCanCollide false: " .. notcol
    end
},

transparency_check = {
    action = function()
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                local t = string.format("%.1f", v.Transparency)
                map[t] = (map[t] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        table.sort(lines)
        if #lines == 0 then return "No parts" end
        return table.concat(lines, "\n")
    end
},

hidden_parts = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and v.Transparency >= 0.95 then
                table.insert(lines, v:GetFullName() .. " | t=" .. v.Transparency)
            end
        end
        if #lines == 0 then return "No hidden parts" end
        return table.concat(lines, "\n")
    end
},

very_small_parts = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and v.Size.Magnitude < 1 then
                table.insert(lines, v:GetFullName() .. " | " .. tostring(v.Size))
            end
        end
        if #lines == 0 then return "No very small parts" end
        return table.concat(lines, "\n")
    end
},

very_big_parts = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and v.Size.Magnitude > 500 then
                table.insert(lines, v:GetFullName() .. " | " .. tostring(v.Size))
            end
        end
        if #lines == 0 then return "No very big parts" end
        return table.concat(lines, "\n")
    end
},

unanchored_list = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and not v.Anchored then
                table.insert(lines, v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "All anchored" end
        return table.concat(lines, "\n")
    end
},

textures = {
    action = function()
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Decal") or v:IsA("Texture") then
                map[v.ClassName] = (map[v.ClassName] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        if #lines == 0 then return "No textures/decals" end
        return table.concat(lines, "\n")
    end
},

meshscan = {
    action = function()
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("MeshPart") or v:IsA("SpecialMesh") or v:IsA("FileMesh") then
                map[v.ClassName] = (map[v.ClassName] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        if #lines == 0 then return "No meshes" end
        return table.concat(lines, "\n")
    end
},

soundscan = {
    action = function()
        local map = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("Sound") then
                map[v.SoundId] = (map[v.SoundId] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. " => " .. n) end
        if #lines == 0 then return "No sounds" end
        return table.concat(lines, "\n")
    end
},

remote_count = {
    action = function()
        local re, rf = 0, 0
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("RemoteEvent") then re = re + 1
            elseif v:IsA("RemoteFunction") then rf = rf + 1 end
        end
        return "RemoteEvents: " .. re .. "\nRemoteFunctions: " .. rf
    end
},

remote_unsafe = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                local full = v:GetFullName():lower()
                if full:find("admin") or full:find("ban") or full:find("kick") or full:find("command") or full:find("cmd") or full:find("give") or full:find("cash") or full:find("money") then
                    table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
                end
            end
        end
        if #lines == 0 then return "No suspicious remotes" end
        return table.concat(lines, "\n")
    end
},

remote_parents = {
    action = function()
        local map = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("RemoteEvent") or v:IsA("RemoteFunction") then
                local p = tostring(v.Parent and v.Parent:GetFullName())
                map[p] = (map[p] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. " => " .. n) end
        if #lines == 0 then return "No remotes" end
        return table.concat(lines, "\n")
    end
},

anticheat_scan = {
    action = function()
        local lines = {}
        local suspicious = { "anticheat", "anti_cheat", "ac_", "ban", "kick", "detect", "guard", "watch" }
        for _, v in ipairs(game:GetDescendants()) do
            local n = v.Name:lower()
            for _, s in ipairs(suspicious) do
                if n:find(s, 1, true) then
                    table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
                    break
                end
            end
        end
        if #lines == 0 then return "No anticheat names" end
        return table.concat(lines, "\n")
    end
},

gui_buttons = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("TextButton") or v:IsA("ImageButton") then
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName() .. " | " .. tostring(v.Text))
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No buttons" end
        return table.concat(lines, "\n")
    end
},

gui_frames = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("Frame") or v:IsA("ScrollingFrame") then
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No frames" end
        return table.concat(lines, "\n")
    end
},

all_values = {
    action = function()
        local map = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("ValueBase") then
                map[v.ClassName] = (map[v.ClassName] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        if #lines == 0 then return "No values" end
        return table.concat(lines, "\n")
    end
},

attributes = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: attributes <name>" end
        local name = args[1]
        for _, v in ipairs(game:GetDescendants()) do
            if v.Name == name or v:GetFullName():find(name) then
                local attrs = v:GetAttributes()
                local lines = {}
                for k, val in pairs(attrs) do
                    table.insert(lines, k .. " = " .. tostring(val))
                end
                if #lines == 0 then return "No attributes" end
                return table.concat(lines, "\n")
            end
        end
        return "ERROR|Not found"
    end
},

tags = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetDescendants()) do
            local tags = v:GetTags()
            if #tags > 0 then
                table.insert(lines, v:GetFullName() .. " => " .. table.concat(tags, ", "))
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No tags" end
        return table.concat(lines, "\n")
    end
},

modules = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("ModuleScript") then
                table.insert(lines, v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No modules" end
        return table.concat(lines, "\n")
    end
},

localscripts = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("LocalScript") then
                table.insert(lines, v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No LocalScripts" end
        return table.concat(lines, "\n")
    end
},

serverscripts = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("Script") then
                table.insert(lines, v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No Scripts" end
        return table.concat(lines, "\n")
    end
},

disabled_scripts = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetDescendants()) do
            if (v:IsA("Script") or v:IsA("LocalScript")) and v.Disabled then
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No disabled scripts" end
        return table.concat(lines, "\n")
    end
},

enabled_scripts = {
    action = function()
        local count = 0
        for _, v in ipairs(game:GetDescendants()) do
            if (v:IsA("Script") or v:IsA("LocalScript")) and not v.Disabled then
                count = count + 1
            end
        end
        return "Enabled scripts: " .. count
    end
},

workspace_children = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetChildren()) do
            table.insert(lines, v.ClassName .. " | " .. v.Name)
        end
        if #lines == 0 then return "Workspace empty" end
        return table.concat(lines, "\n")
    end
},

services = {
    action = function()
        local lines = {}
        for _, name in ipairs({ "Players","ReplicatedStorage","ServerStorage","ServerScriptService","StarterGui","StarterPack","Lighting","SoundService","Chat","Teams","Workspace","ReplicatedFirst","TestService","NetworkClient" }) do
            local s = game:FindService(name)
            if s then table.insert(lines, name .. " | children=" .. #s:GetChildren()) end
        end
        return table.concat(lines, "\n")
    end
},

lighting = {
    action = function()
        local l = game:GetService("Lighting")
        return table.concat({
            "ClockTime: " .. tostring(l.ClockTime),
            "Brightness: " .. tostring(l.Brightness),
            "Ambient: " .. tostring(l.Ambient),
            "OutdoorAmbient: " .. tostring(l.OutdoorAmbient),
            "FogStart: " .. tostring(l.FogStart),
            "FogEnd: " .. tostring(l.FogEnd),
            "FogColor: " .. tostring(l.FogColor),
            "GlobalShadows: " .. tostring(l.GlobalShadows),
            "EnvironmentDiffuseScale: " .. tostring(l.EnvironmentDiffuseScale),
            "EnvironmentSpecularScale: " .. tostring(l.EnvironmentSpecularScale),
        }, "\n")
    end
},

sound_service = {
    action = function()
        local s = game:GetService("SoundService")
        return "AmbientReverb: " .. tostring(s.AmbientReverb) .. "\nDistanceFactor: " .. tostring(s.DistanceFactor)
    end
},

players_meta = {
    action = function()
        local lines = {}
        for _, p in ipairs(game.Players:GetPlayers()) do
            table.insert(lines, string.format("%s | id=%d | age=%d | team=%s", p.Name, p.UserId, p.AccountAge, p.Team and p.Team.Name or "-"))
        end
        return table.concat(lines, "\n")
    end
},

chat_scan = {
    action = function()
        local lines = {}
        local chat = game:FindService("Chat")
        if chat then
            for _, v in ipairs(chat:GetDescendants()) do
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
            end
        end
        if #lines == 0 then return "No chat objects" end
        return table.concat(lines, "\n")
    end
},

teams_scan = {
    action = function()
        local lines = {}
        local t = game:GetService("Teams")
        for _, team in ipairs(t:GetChildren()) do
            table.insert(lines, team.Name .. " | players=" .. #team:GetPlayers() .. " | color=" .. tostring(team.TeamColor))
        end
        if #lines == 0 then return "No teams" end
        return table.concat(lines, "\n")
    end
},

humanoids_scan = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Humanoid") then
                table.insert(lines, v:GetFullName() .. " | HP=" .. math.floor(v.Health) .. "/" .. math.floor(v.MaxHealth))
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No humanoids" end
        return table.concat(lines, "\n")
    end
},

anims_scan = {
    action = function()
        local map = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("Animation") or v:IsA("AnimationTrack") then
                map[v.ClassName] = (map[v.ClassName] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        if #lines == 0 then return "No animations" end
        return table.concat(lines, "\n")
    end
},

tools_scan = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("Tool") then
                table.insert(lines, v:GetFullName() .. " | " .. (v:FindFirstChildOfClass("Humanoid") and "held" or "stored"))
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No tools in world" end
        return table.concat(lines, "\n")
    end
},

vehicle_seats = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("VehicleSeat") then
                table.insert(lines, v:GetFullName() .. " | occ=" .. tostring(v.Occupant))
            end
        end
        if #lines == 0 then return "No VehicleSeats" end
        return table.concat(lines, "\n")
    end
},

seats = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Seat") then
                table.insert(lines, v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No seats" end
        return table.concat(lines, "\n")
    end
},

click_detectors = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("ClickDetector") then
                table.insert(lines, v:GetFullName() .. " | range=" .. tostring(v.MaxActivationDistance))
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No ClickDetectors" end
        return table.concat(lines, "\n")
    end
},

proximity_prompts = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("ProximityPrompt") then
                table.insert(lines, v:GetFullName() .. " | action=" .. v.ActionText)
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No ProximityPrompts" end
        return table.concat(lines, "\n")
    end
},

beams_scan = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Beam") or v:IsA("Trail") then
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No beams/trails" end
        return table.concat(lines, "\n")
    end
},

particle_scan = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("ParticleEmitter") then
                table.insert(lines, v:GetFullName() .. " | rate=" .. tostring(v.Rate))
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No ParticleEmitters" end
        return table.concat(lines, "\n")
    end
},

constraints_scan = {
    action = function()
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Constraint") then
                map[v.ClassName] = (map[v.ClassName] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do table.insert(lines, k .. ": " .. n) end
        if #lines == 0 then return "No constraints" end
        return table.concat(lines, "\n")
    end
},

attachments_scan = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Attachment") then
                table.insert(lines, v:GetFullName() .. " | pos=" .. tostring(v.Position))
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No attachments" end
        return table.concat(lines, "\n")
    end
},

collision_groups = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and v.CollisionGroup ~= "Default" then
                table.insert(lines, v:GetFullName() .. " | group=" .. v.CollisionGroup)
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "All in Default collision group" end
        return table.concat(lines, "\n")
    end
},

network_owner = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and v:GetNetworkOwner() then
                table.insert(lines, v:GetFullName() .. " | owner=" .. tostring(v:GetNetworkOwner()))
                if #lines >= 200 then break end
            end
        end
        if #lines == 0 then return "No network owners" end
        return table.concat(lines, "\n")
    end
},

mass_report = {
    action = function()
        local total = 0
        local top = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                local m = v:GetMass()
                total = total + m
                table.insert(top, { name = v:GetFullName(), mass = m })
            end
        end
        table.sort(top, function(a, b) return a.mass > b.mass end)
        local lines = { "Total mass: " .. string.format("%.2f", total), "Top 20:" }
        for i = 1, math.min(20, #top) do
            table.insert(lines, string.format("%.2f | %s", top[i].mass, top[i].name))
        end
        return table.concat(lines, "\n")
    end
},

physics_report = {
    action = function()
        local rp = workspace:GetRealPhysicsFPS()
        local total, unanch = 0, 0
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                total = total + 1
                if not v.Anchored then unanch = unanch + 1 end
            end
        end
        return table.concat({
            "PhysicsFPS: " .. string.format("%.1f", rp),
            "Parts: " .. total,
            "Unanchored: " .. unanch,
            "Gravity: " .. tostring(workspace.Gravity),
        }, "\n")
    end
},

camera_info = {
    action = function()
        local cam = workspace.CurrentCamera
        if not cam then return "No camera" end
        return table.concat({
            "Position: " .. tostring(cam.CFrame.Position),
            "LookVector: " .. tostring(cam.CFrame.LookVector),
            "FieldOfView: " .. cam.FieldOfView,
            "CameraType: " .. tostring(cam.CameraType),
            "CameraSubject: " .. tostring(cam.CameraSubject),
        }, "\n")
    end
},

mouse_info = {
    action = function()
        local m = game.Players.LocalPlayer:GetMouse()
        return table.concat({
            "Position: " .. tostring(m.X) .. "," .. tostring(m.Y),
            "Hit: " .. tostring(m.Hit),
            "Target: " .. tostring(m.Target),
            "UnitRay origin: " .. tostring(m.UnitRay.Origin),
            "UnitRay direction: " .. tostring(m.UnitRay.Direction),
        }, "\n")
    end
},

raycast = {
    action = function(args)
        local dist = tonumber(args[1]) or 100
        local cam = workspace.CurrentCamera
        local origin = cam.CFrame.Position
        local dir = cam.CFrame.LookVector * dist
        local params = RaycastParams.new()
        params.FilterType = Enum.RaycastFilterType.Exclude
        params.FilterDescendantsInstances = { game.Players.LocalPlayer.Character }
        local result = workspace:Raycast(origin, dir, params)
        if not result then return "No hit" end
        return table.concat({
            "Hit: " .. result.Instance:GetFullName(),
            "Position: " .. tostring(result.Position),
            "Normal: " .. tostring(result.Normal),
            "Distance: " .. string.format("%.2f", result.Distance),
            "Material: " .. tostring(result.Material),
        }, "\n")
    end
},

raycast_all = {
    action = function(args)
        local dist = tonumber(args[1]) or 100
        local cam = workspace.CurrentCamera
        local origin = cam.CFrame.Position
        local dir = cam.CFrame.LookVector * dist
        local params = RaycastParams.new()
        params.FilterType = Enum.RaycastFilterType.Exclude
        params.FilterDescendantsInstances = { game.Players.LocalPlayer.Character }
        local result = workspace:Raycast(origin, dir, params)
        if not result then return "No hit" end
        local lines = {}
        for _, v in ipairs(result.Instance:GetChildren()) do
            table.insert(lines, v.ClassName .. " | " .. v.Name)
        end
        return "Hit " .. result.Instance:GetFullName() .. "\nChildren:\n" .. table.concat(lines, "\n")
    end
},

teleport_to_part = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: teleport_to_part <name>" end
        local name = args[1]
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and (v.Name == name or v:GetFullName():find(name)) then
                local lp = game.Players.LocalPlayer
                local hrp = lp.Character and lp.Character:FindFirstChild("HumanoidRootPart")
                if not hrp then return "ERROR|Character not found" end
                hrp.CFrame = v.CFrame + Vector3.new(0, 5, 0)
                return "SUCCESS|Teleported to " .. v:GetFullName()
            end
        end
        return "ERROR|Part not found"
    end
},

copy_part = {
    action = function()
        local target = game.Players.LocalPlayer:GetMouse().Target
        if not target then return "ERROR|Look at a part" end
        local clone = target:Clone()
        clone.Position = target.Position + Vector3.new(0, target.Size.Y + 2, 0)
        clone.Anchored = true
        clone.Parent = workspace
        return "SUCCESS|Copied " .. target.Name
    end
},

color_part = {
    action = function(args)
        if #args < 3 then return "ERROR|Usage: color_part <r> <g> <b>" end
        local r, g, b = tonumber(args[1]), tonumber(args[2]), tonumber(args[3])
        if not (r and g and b) then return "ERROR|Bad numbers" end
        local target = game.Players.LocalPlayer:GetMouse().Target
        if not target or not target:IsA("BasePart") then return "ERROR|Look at a part" end
        target.Color = Color3.fromRGB(r, g, b)
        return "SUCCESS|Colored " .. target.Name
    end
},

move_part = {
    action = function(args)
        if #args < 3 then return "ERROR|Usage: move_part <x> <y> <z>" end
        local x, y, z = tonumber(args[1]), tonumber(args[2]), tonumber(args[3])
        if not (x and y and z) then return "ERROR|Bad numbers" end
        local target = game.Players.LocalPlayer:GetMouse().Target
        if not target or not target:IsA("BasePart") then return "ERROR|Look at a part" end
        target.Position = target.Position + Vector3.new(x, y, z)
        return "SUCCESS|Moved " .. target.Name
    end
},

resize_part = {
    action = function(args)
        if #args < 3 then return "ERROR|Usage: resize_part <x> <y> <z>" end
        local x, y, z = tonumber(args[1]), tonumber(args[2]), tonumber(args[3])
        if not (x and y and z) then return "ERROR|Bad numbers" end
        local target = game.Players.LocalPlayer:GetMouse().Target
        if not target or not target:IsA("BasePart") then return "ERROR|Look at a part" end
        target.Size = Vector3.new(x, y, z)
        return "SUCCESS|Resized " .. target.Name
    end
},

anchor_part = {
    action = function()
        local target = game.Players.LocalPlayer:GetMouse().Target
        if not target or not target:IsA("BasePart") then return "ERROR|Look at a part" end
        target.Anchored = not target.Anchored
        return "SUCCESS|" .. target.Name .. " anchored=" .. tostring(target.Anchored)
    end
},

transparency_part = {
    action = function(args)
        local t = tonumber(args[1]) or 0.5
        local target = game.Players.LocalPlayer:GetMouse().Target
        if not target or not target:IsA("BasePart") then return "ERROR|Look at a part" end
        target.Transparency = math.clamp(t, 0, 1)
        return "SUCCESS|Transparency=" .. target.Transparency
    end
},

material_part = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: material_part <Material>" end
        local m = args[1]
        if not Enum.Material[m] then return "ERROR|Unknown material" end
        local target = game.Players.LocalPlayer:GetMouse().Target
        if not target or not target:IsA("BasePart") then return "ERROR|Look at a part" end
        target.Material = Enum.Material[m]
        return "SUCCESS|Material=" .. m
    end
},

delete_part = {
    action = function()
        local target = game.Players.LocalPlayer:GetMouse().Target
        if not target then return "ERROR|Look at a part" end
        local n = target.Name
        target:Destroy()
        return "SUCCESS|Deleted " .. n
    end
},

clone_model = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: clone_model <name>" end
        local name = args[1]
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Model") and (v.Name == name or v:GetFullName():find(name)) then
                local c = v:Clone()
                if c.PrimaryPart then
                    c:SetPrimaryPartCFrame(c.PrimaryPart.CFrame + Vector3.new(0, 10, 0))
                end
                c.Parent = workspace
                return "SUCCESS|Cloned " .. v:GetFullName()
            end
        end
        return "ERROR|Model not found"
    end
},

delete_model = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: delete_model <name>" end
        local name = args[1]
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Model") and (v.Name == name or v:GetFullName():find(name)) then
                v:Destroy()
                return "SUCCESS|Deleted " .. name
            end
        end
        return "ERROR|Model not found"
    end
},

unanchor_all = {
    action = function()
        local n = 0
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and v.Anchored then
                v.Anchored = false
                n = n + 1
            end
        end
        return "SUCCESS|Unanchored " .. n .. " parts"
    end
},

anchor_all = {
    action = function()
        local n = 0
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") and not v.Anchored then
                v.Anchored = true
                n = n + 1
            end
        end
        return "SUCCESS|Anchored " .. n .. " parts"
    end
},

remove_all = {
    action = function()
        local n = 0
        for _, v in ipairs(workspace:GetChildren()) do
            if not v:IsA("Camera") and not v:IsA("Terrain") then
                v:Destroy()
                n = n + 1
            end
        end
        return "SUCCESS|Removed " .. n .. " top-level objects"
    end
},

clear_effects = {
    action = function()
        local n = 0
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("ParticleEmitter") or v:IsA("Fire") or v:IsA("Smoke") or v:IsA("Sparkles") then
                v:Destroy()
                n = n + 1
            end
        end
        return "SUCCESS|Removed " .. n .. " effects"
    end
},

clear_decals = {
    action = function()
        local n = 0
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Decal") or v:IsA("Texture") then
                v:Destroy()
                n = n + 1
            end
        end
        return "SUCCESS|Removed " .. n .. " decals/textures"
    end
},

disable_scripts = {
    action = function()
        local n = 0
        for _, v in ipairs(game:GetDescendants()) do
            if v:IsA("Script") or v:IsA("LocalScript") then
                v.Disabled = true
                n = n + 1
            end
        end
        return "SUCCESS|Disabled " .. n .. " scripts"
    end
},

enable_scripts = {
    action = function()
        local n = 0
        for _, v in ipairs(game:GetDescendants()) do
            if (v:IsA("Script") or v:IsA("LocalScript")) and v.Disabled then
                v.Disabled = false
                n = n + 1
            end
        end
        return "SUCCESS|Enabled " .. n .. " scripts"
    end
},

clear_workspace = {
    action = function()
        local n = 0
        for _, v in ipairs(workspace:GetChildren()) do
            if v:IsA("Model") or v:IsA("BasePart") then
                v:Destroy()
                n = n + 1
            end
        end
        return "SUCCESS|Cleared " .. n .. " top-level objects"
    end
},

viewstats = {
    action = function()
        local stats = game:GetService("Stats")
        local lines = {}
        local function add(name, path)
            local ok, val = pcall(function() return path(stats) end)
            if ok and val then table.insert(lines, name .. ": " .. tostring(val)) end
        end
        local ok, perf = pcall(function() return stats.PerformanceStats end)
        if ok and perf then
            table.insert(lines, "CPU: " .. tostring(perf.CPU))
            table.insert(lines, "GPU: " .. tostring(perf.GPU))
            table.insert(lines, "Memory: " .. tostring(perf.Memory))
            table.insert(lines, "Ping: " .. tostring(perf.Ping))
            table.insert(lines, "Network In: " .. tostring(perf.NetworkIn))
            table.insert(lines, "Network Out: " .. tostring(perf.NetworkOut))
        end
        if #lines == 0 then return "Stats unavailable" end
        return table.concat(lines, "\n")
    end
},

memory = {
    action = function()
        local stats = game:GetService("Stats")
        local ok, mem = pcall(function() return stats:GetTotalMemoryUsageMb() end)
        if ok and mem then return string.format("Memory: %.2f MB", mem) end
        return "Memory unavailable"
    end
},

ping2 = {
    action = function()
        local stats = game:GetService("Stats")
        local ok, ping = pcall(function() return stats.Network.ServerStatsItem["Data Ping"]:GetValue() end)
        if ok and ping then return "Ping: " .. tostring(ping) .. " ms" end
        return "Ping unavailable"
    end
},

fps = {
    action = function()
        local run = game:GetService("RunService")
        local frames, t0 = 0, tick()
        local conn
        conn = run.RenderStepped:Connect(function()
            frames = frames + 1
        end)
        task.wait(1)
        conn:Disconnect()
        return "FPS approx: " .. frames
    end
},

network = {
    action = function()
        local stats = game:GetService("Stats")
        local lines = {}
        local ok, net = pcall(function() return stats.Network end)
        if ok and net then
            for _, item in ipairs(net:GetChildren()) do
                if item:IsA("StatsItem") then
                    local ok2, val = pcall(function() return item:GetValue() end)
                    if ok2 then table.insert(lines, item.Name .. ": " .. tostring(val)) end
                end
            end
        end
        if #lines == 0 then return "No network stats" end
        return table.concat(lines, "\n")
    end
},

capcheck = {
    action = function()
        local lines = {}
        local ok, net = pcall(function() return game:GetService("Stats").Network end)
        if ok and net then
            local ok2, val = pcall(function() return net.ServerStatsItem["Data Ping"]:GetValue() end)
            if ok2 then table.insert(lines, "Ping: " .. tostring(val)) end
            local ok3, val2 = pcall(function() return net.ServerStatsItem["Data Sent"]:GetValue() end)
            if ok3 then table.insert(lines, "Sent: " .. tostring(val2)) end
            local ok4, val3 = pcall(function() return net.ServerStatsItem["Data Received"]:GetValue() end)
            if ok4 then table.insert(lines, "Received: " .. tostring(val3)) end
        end
        if #lines == 0 then return "Capcheck unavailable" end
        return table.concat(lines, "\n")
    end
},

dump_all = {
    action = function(args)
        local depth = tonumber(args[1]) or 1
        local lines = {}
        local function walk(obj, d, prefix)
            table.insert(lines, prefix .. obj.ClassName .. " | " .. obj.Name)
            if d >= depth then return end
            for _, c in ipairs(obj:GetChildren()) do
                walk(c, d + 1, prefix .. "  ")
            end
        end
        walk(workspace, 0, "")
        if #lines > 2000 then
            local out = {}
            for i = 1, 2000 do out[i] = lines[i] end
            table.insert(out, "... truncated ...")
            return table.concat(out, "\n")
        end
        return table.concat(lines, "\n")
    end
},

tree = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: tree <name> [depth]" end
        local name = args[1]
        local depth = tonumber(args[2]) or 3
        for _, v in ipairs(game:GetDescendants()) do
            if v.Name == name or v:GetFullName():find(name) then
                local lines = {}
                local function walk(obj, d, prefix)
                    table.insert(lines, prefix .. obj.ClassName .. " | " .. obj.Name)
                    if d >= depth then return end
                    for _, c in ipairs(obj:GetChildren()) do
                        walk(c, d + 1, prefix .. "  ")
                    end
                end
                walk(v, 0, "")
                return table.concat(lines, "\n")
            end
        end
        return "ERROR|Not found"
    end
},

clone_scan = {
    action = function()
        local map = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BasePart") then
                map[v.Name] = (map[v.Name] or 0) + 1
            end
        end
        local lines = {}
        for k, n in pairs(map) do
            if n > 10 then
                table.insert(lines, k .. ": " .. n)
            end
        end
        table.sort(lines)
        if #lines == 0 then return "No heavy duplicates" end
        return table.concat(lines, "\n")
    end
},

deep_count = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: deep_count <name>" end
        local name = args[1]
        for _, v in ipairs(game:GetDescendants()) do
            if v.Name == name or v:GetFullName():find(name) then
                return "Descendants: " .. #v:GetDescendants() .. "\nChildren: " .. #v:GetChildren()
            end
        end
        return "ERROR|Not found"
    end
},

root_scan = {
    action = function()
        local lines = {}
        for _, v in ipairs(game:GetChildren()) do
            table.insert(lines, v.ClassName .. " | " .. v.Name .. " | children=" .. #v:GetChildren())
        end
        return table.concat(lines, "\n")
    end
},

player_parts = {
    action = function()
        local lines = {}
        for _, p in ipairs(game.Players:GetPlayers()) do
            if p.Character then
                local n = 0
                for _, v in ipairs(p.Character:GetDescendants()) do
                    if v:IsA("BasePart") then n = n + 1 end
                end
                table.insert(lines, p.Name .. " => " .. n .. " parts")
            end
        end
        if #lines == 0 then return "No characters" end
        return table.concat(lines, "\n")
    end
},

charinfo = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: charinfo <name>" end
        local p = game.Players:FindFirstChild(args[1])
        if not p or not p.Character then return "ERROR|No character" end
        local lines = {}
        for _, v in ipairs(p.Character:GetDescendants()) do
            table.insert(lines, v.ClassName .. " | " .. v.Name)
            if #lines >= 300 then break end
        end
        return table.concat(lines, "\n")
    end
},

accessories = {
    action = function()
        local lines = {}
        for _, p in ipairs(game.Players:GetPlayers()) do
            if p.Character then
                for _, v in ipairs(p.Character:GetChildren()) do
                    if v:IsA("Accessory") then
                        table.insert(lines, p.Name .. " | " .. v.Name)
                    end
                end
            end
        end
        if #lines == 0 then return "No accessories" end
        return table.concat(lines, "\n")
    end
},

clothing = {
    action = function()
        local lines = {}
        for _, p in ipairs(game.Players:GetPlayers()) do
            if p.Character then
                for _, v in ipairs(p.Character:GetChildren()) do
                    if v:IsA("Clothing") or v:IsA("Shirt") or v:IsA("Pants") then
                        table.insert(lines, p.Name .. " | " .. v.ClassName .. " | " .. v.Name)
                    end
                end
            end
        end
        if #lines == 0 then return "No clothing" end
        return table.concat(lines, "\n")
    end
},

face = {
    action = function()
        local lines = {}
        for _, p in ipairs(game.Players:GetPlayers()) do
            if p.Character then
                local head = p.Character:FindFirstChild("Head")
                if head then
                    local face = head:FindFirstChildOfClass("Decal")
                    if face then table.insert(lines, p.Name .. " | " .. face.Texture) end
                end
            end
        end
        if #lines == 0 then return "No faces" end
        return table.concat(lines, "\n")
    end
},

r6check = {
    action = function()
        local lp = game.Players.LocalPlayer
        local char = lp.Character
        if not char then return "No character" end
        local r6 = char:FindFirstChild("Torso") ~= nil
        local r15 = char:FindFirstChild("UpperTorso") ~= nil
        return "R6: " .. tostring(r6) .. "\nR15: " .. tostring(r15)
    end
},

bone_scan = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Bone") then
                table.insert(lines, v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No bones" end
        return table.concat(lines, "\n")
    end
},

motor_scan = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Motor6D") then
                table.insert(lines, v:GetFullName() .. " | " .. tostring(v.Part0) .. " -> " .. tostring(v.Part1))
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No Motor6D" end
        return table.concat(lines, "\n")
    end
},

welds = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("Weld") or v:IsA("WeldConstraint") then
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No welds" end
        return table.concat(lines, "\n")
    end
},

body_movers = {
    action = function()
        local lines = {}
        for _, v in ipairs(workspace:GetDescendants()) do
            if v:IsA("BodyMover") then
                table.insert(lines, v.ClassName .. " | " .. v:GetFullName())
                if #lines >= 300 then break end
            end
        end
        if #lines == 0 then return "No BodyMovers" end
        return table.concat(lines, "\n")
    end
},

hats = {
    action = function()
        local lines = {}
        for _, p in ipairs(game.Players:GetPlayers()) do
            if p.Character then
                for _, v in ipairs(p.Character:GetChildren()) do
                    if v:IsA("Accessory") or v.Name:lower():find("hat") then
                        table.insert(lines, p.Name .. " | " .. v.Name)
                    end
                end
            end
        end
        if #lines == 0 then return "No hats" end
        return table.concat(lines, "\n")
    end
},

tool_in_backpack = {
    action = function(args)
        local name = args[1]
        if not name then return "ERROR|Usage: tool_in_backpack <tool>" end
        local lines = {}
        for _, p in ipairs(game.Players:GetPlayers()) do
            local bp = p:FindFirstChild("Backpack")
            if bp then
                for _, t in ipairs(bp:GetChildren()) do
                    if t:IsA("Tool") and t.Name:lower():find(name:lower(), 1, true) then
                        table.insert(lines, p.Name .. " | " .. t.Name)
                    end
                end
            end
        end
        if #lines == 0 then return "None found" end
        return table.concat(lines, "\n")
    end
},

server_list = {
    action = function()
        local ok, servers = pcall(function()
            return game:GetService("HttpService"):JSONDecode(game:HttpGet("https://games.roblox.com/v1/games/" .. game.PlaceId .. "/servers/Public?sortOrder=Asc&limit=100"))
        end)
        if not ok or not servers or not servers.data then return "ERROR|Failed" end
        local lines = {}
        for _, s in ipairs(servers.data) do
            table.insert(lines, string.format("%s | %d/%d | ping=%s", s.id, s.playing, s.maxPlayers, tostring(s.ping)))
        end
        if #lines == 0 then return "No servers" end
        return table.concat(lines, "\n")
    end
},

server_ping = {
    action = function()
        local t0 = tick()
        pcall(function() game:HttpGet("https://games.roblox.com/v1/games/" .. game.PlaceId) end)
        return "HTTP ping: " .. math.floor((tick() - t0) * 1000) .. " ms"
    end
},

http = {
    action = function(args)
        if not args[1] then return "ERROR|Usage: http <url>" end
        local ok, res = pcall(function() return game:HttpGet(args[1]) end)
        if not ok then return "ERROR|" .. tostring(res) end
        if #res > 4000 then return res:sub(1, 4000) .. "\n... truncated" end
        return res
    end
},

json = {
    action = function(args)
        local body = table.concat(args, " ")
        local ok, decoded = pcall(function() return game:GetService("HttpService"):JSONDecode(body) end)
        if not ok then return "ERROR|Invalid JSON" end
        local function dump(t, d)
            local out = {}
            local pad = string.rep("  ", d)
            for k, v in pairs(t) do
                if type(v) == "table" then
                    table.insert(out, pad .. tostring(k) .. ":")
                    table.insert(out, dump(v, d + 1))
                else
                    table.insert(out, pad .. tostring(k) .. " = " .. tostring(v))
                end
            end
            return table.concat(out, "\n")
        end
        return dump(decoded, 0)
    end
}