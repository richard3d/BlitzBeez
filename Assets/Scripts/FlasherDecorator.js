#pragma strict

public var m_Color:Color = Color.white;
public var m_NumberOfFlashes:int = 7;
public var m_FlashDuration:float = 0.08;
//this script makes bees flash a certain color
private var m_Material:Shader;
private var m_OrigColors:Color[];
private var m_OrigMaterials:Shader[];
function Start () {

	m_Material = Shader.Find("Self-Illumin/Diffuse");
	
	m_OrigColors = new Color[ renderer.materials.length];
	m_OrigMaterials = new Shader[ renderer.materials.length];
	
	for( var i:int = 0; i < renderer.materials.length; i++)
	{
		m_OrigColors[i] = renderer.materials[i].color;
		m_OrigMaterials[i] = renderer.materials[i].shader;
	}
	
	yield SwitchColor(m_NumberOfFlashes, m_FlashDuration);
}

function Update () {

 

}

function SwitchColor(num:int,time:float)
{

	for(var k:int = 0; k < num; k++)
	{
		
		for( var i:int = 0; i < renderer.materials.length; i++)
		{
			
			renderer.materials[i].shader = renderer.materials[i].shader == m_Material ?  m_OrigMaterials[i] : m_Material;
			renderer.materials[i].color  = renderer.materials[i].color == m_Color?  m_OrigColors[i] : m_Color;
		}
		yield WaitForSeconds(time);
	}
	Destroy(this);
}

function OnDestroy()
{
	
	for( var i:int = 0; i < renderer.materials.length; i++)
	{
		if(	renderer.materials[i] != null && m_OrigMaterials != null)
		{
			renderer.materials[i].shader= m_OrigMaterials[i];
			renderer.materials[i].color = m_OrigColors[i];
		}
	}
}