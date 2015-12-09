#pragma strict

public var m_Color:Color = Color.white;
public var m_AffectedObj:GameObject = null; //if null, performs the action on this object otherwise on the assigned one
public var m_NumberOfFlashes:int = 7;
public var m_FlashDuration:float = 0.08;
//this script makes bees flash a certain color
private var m_Material:Shader;
private var m_OrigColors:Color[];
private var m_OrigMaterials:Shader[];
function Start () {

	StartFlash();
}


function StartFlash()
{
	m_Material = Shader.Find("Self-Illumin/Diffuse");
	
	if(m_AffectedObj == null)
	{
		m_OrigColors = new Color[ renderer.materials.length];
		m_OrigMaterials = new Shader[ renderer.materials.length];
		
		for( var i:int = 0; i < renderer.materials.length; i++)
		{
			if(renderer.materials[i].HasProperty("_Color"))
				m_OrigColors[i] = renderer.materials[i].color;
			else if(renderer.materials[i].HasProperty("_TintColor"))
				m_OrigColors[i] = renderer.materials[i].GetColor("_TintColor");
			m_OrigMaterials[i] = renderer.materials[i].shader;
		}
	}
	else
	{
		m_OrigColors = new Color[ m_AffectedObj.renderer.materials.length];
		m_OrigMaterials = new Shader[ m_AffectedObj.renderer.materials.length];
		
		for( i = 0; i < m_AffectedObj.renderer.materials.length; i++)
		{
			if(m_AffectedObj.renderer.materials[i].HasProperty("_Color"))
				m_OrigColors[i] = m_AffectedObj.renderer.materials[i].color;
			else if(m_AffectedObj.renderer.materials[i].HasProperty("_TintColor"))
				m_OrigColors[i] = m_AffectedObj.renderer.materials[i].GetColor("_TintColor");
			m_OrigMaterials[i] = m_AffectedObj.renderer.materials[i].shader;
		}
	}
	
	yield SwitchColor(m_NumberOfFlashes, m_FlashDuration);
}

function Update () {

 

}

function SwitchColor(num:int,time:float)
{

	for(var k:int = 0; k < num; k++)
	{
		if(m_AffectedObj == null)
		{
			for( var i:int = 0; i < renderer.materials.length; i++)
			{
				renderer.materials[i].shader = renderer.materials[i].shader == m_Material ?  m_OrigMaterials[i] : m_Material;
				if(renderer.materials[i].HasProperty("_Color"))
					renderer.materials[i].color  = renderer.materials[i].color == m_Color?  m_OrigColors[i] : m_Color;
				else if(renderer.materials[i].HasProperty("_TintColor"))
					renderer.materials[i].SetColor("_TintColor", renderer.materials[i].GetColor("_TintColor") == m_Color?  m_OrigColors[i] : m_Color);
			}
		}
		else
		{
			for( i = 0; i < m_AffectedObj.renderer.materials.length; i++)
			{
				m_AffectedObj.renderer.materials[i].shader = m_AffectedObj.renderer.materials[i].shader == m_Material ?  m_OrigMaterials[i] : m_Material;
				if(m_AffectedObj.renderer.materials[i].HasProperty("_Color"))
					m_AffectedObj.renderer.materials[i].color  = m_AffectedObj.renderer.materials[i].color == m_Color?  m_OrigColors[i] : m_Color;
				else if(m_AffectedObj.renderer.materials[i].HasProperty("_TintColor"))
					m_AffectedObj.renderer.materials[i].SetColor("_TintColor", m_AffectedObj.renderer.materials[i].GetColor("_TintColor") == m_Color?  m_OrigColors[i] : m_Color);
			}
		}
		
		yield WaitForSeconds(time);
	}
	Destroy(this);
}

function OnDestroy()
{
	if(m_AffectedObj == null)
	{
		for( var i:int = 0; i < renderer.materials.length; i++)
		{
			if(	renderer.materials[i] != null && m_OrigMaterials != null)
			{
				renderer.materials[i].shader= m_OrigMaterials[i];
				if(renderer.materials[i].HasProperty("_Color"))
					renderer.materials[i].color = m_OrigColors[i];
				else if(renderer.materials[i].HasProperty("_TintColor"))
					renderer.materials[i].SetColor("_TintColor", m_OrigColors[i]);
			}
		}
	}
	else
	{
		for( i = 0; i < m_AffectedObj.renderer.materials.length; i++)
		{
			if(	m_AffectedObj.renderer.materials[i] != null && m_OrigMaterials != null)
			{
				m_AffectedObj.renderer.materials[i].shader= m_OrigMaterials[i];
				if(m_AffectedObj.renderer.materials[i].HasProperty("_Color"))
					m_AffectedObj.renderer.materials[i].color = m_OrigColors[i];
				else if(m_AffectedObj.renderer.materials[i].HasProperty("_TintColor"))
					m_AffectedObj.renderer.materials[i].SetColor("_TintColor", m_OrigColors[i]);
			}
		}
	}
}