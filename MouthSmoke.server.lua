local Players = game:GetService("Players")

local TEXTURE = "rbxassetid://3845808160"

Players.PlayerAdded:Connect(function(plr)
	plr.CharacterAdded:Connect(function(char)
		local head = char:WaitForChild("Head")

		local att = Instance.new("Attachment")
		att.Name = "MouthSmoke"
		att.Position = Vector3.new(0, -0.5, -0.65)
		att.Parent = head

		local smoke = Instance.new("ParticleEmitter")
		smoke.Texture = TEXTURE
		smoke.Rate = 5
		smoke.Lifetime = NumberRange.new(1.5, 3)
		smoke.Speed = NumberRange.new(2, 4)
		smoke.SpreadAngle = Vector2.new(10, 10)
		smoke.Size = NumberSequence.new(1, 3)
		smoke.Transparency = NumberSequence.new(0, 1)
		smoke.Color = ColorSequence.new(Color3.fromRGB(200, 200, 200))
		smoke.LightEmission = 0.3
		smoke.Parent = att
	end)
end)