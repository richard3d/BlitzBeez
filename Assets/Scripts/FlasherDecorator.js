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
		m_OrigColors = new Color[ GetComponent.<Renderer>().materials.length];
		m_OrigMaterials = new Shader[ GetComponent.<Renderer>().materials.length];
		
		for( var i:int = 0; i < GetComponent.<Renderer>().materials.length; i++)
		{
			if(GetComponent.<Renderer>().materials[i].HasProperty("_Color"))
				m_OrigColors[i] = GetComponent.<Renderer>().materials[i].color;
			else if(GetComponent.<Renderer>().materials[i].HasProperty("_TintColor"))
				m_OrigColors[i] = GetComponent.<Renderer>().materials[i].GetColor("_TintColor");
			m_OrigMaterials[i] = GetComponent.<Renderer>().materials[i].shader;
		}
	}
	else
	{
		m_OrigColors = new Color[ m_AffectedObj.GetComponent.<Renderer>().materials.length];
		m_OrigMaterials = new Shader[ m_AffectedObj.GetComponent.<Renderer>().materials.length];
		
		for( i = 0; i < m_AffectedObj.GetComponent.<Renderer>().materials.length; i++)
		{
			if(m_AffectedObj.GetComponent.<Renderer>().materials[i].HasProperty("_Color"))
				m_OrigColors[i] = m_AffectedObj.GetComponent.<Renderer>().materials[i].color;
			else if(m_AffectedObj.GetComponent.<Renderer>().materials[i].HasProperty("_TintColor"))
				m_OrigColors[i] = m_AffectedObj.GetComponent.<Renderer>().materials[i].GetColor("_TintColor");
			m_OrigMaterials[i] = m_AffectedObj.GetComponent.<Renderer>().materials[i].shader;
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
			for( var i:int = 0; i < GetComponent.<Renderer>().materials.length; i++)
			{
				GetComponent.<Renderer>().materials[i].shader = GetComponent.<Renderer>().materials[i].shader == m_Material ?  m_OrigMaterials[i] : m_Material;
				if(GetComponent.<Renderer>().materials[i].HasProperty("_Color"))
					GetComponent.<Renderer>().materials[i].color  = GetComponent.<Renderer>().materials[i].color == m_Color?  m_OrigColors[i] : m_Color;
				else if(GetComponent.<Renderer>().materials[i].HasProperty("_TintColor"))
					GetComponent.<Renderer>().materials[i].SetColor("_TintColor", GetComponent.<Renderer>().materials[i].GetColor("_TintColor") == m_Color?  m_OrigColors[i] : m_Color);
			}
		}
		else
		{
			for( i = 0; i < m_AffectedObj.GetComponent.<Renderer>().materials.length; i++)
			{
				m_AffectedObj.GetComponent.<Renderer>().materials[i].shader = m_AffectedObj.GetComponent.<Renderer>().materials[i].shader == m_Material ?  m_OrigMaterials[i] : m_Material;
				if(m_AffectedObj.GetComponent.<Renderer>().materials[i].HasProperty("_Color"))
					m_AffectedObj.GetComponent.<Renderer>().materials[i].color  = m_AffectedObj.GetComponent.<Renderer>().materials[i].color == m_Color?  m_OrigColors[i] : m_Color;
				else if(m_AffectedObj.GetComponent.<Renderer>().materials[i].HasProperty("_TintColor"))
					m_AffectedObj.GetComponent.<Renderer>().materials[i].SetColor("_TintColor", m_AffectedObj.GetComponent.<Renderer>().materials[i].GetColor("_TintColor") == m_Color?  m_OrigColors[i] : m_Color);
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
		for( var i:int = 0; i < GetComponent.<Renderer>().materials.length; i++)
		{
			if(	GetComponent.<Renderer>().materials[i] != null && m_OrigMaterials != null)
			{
				GetComponent.<Renderer>().materials[i].shader= m_OrigMaterials[i];
				if(GetComponent.<Renderer>().materials[i].HasProperty("_Color"))
					GetComponent.<Renderer>().materials[i].color = m_OrigColors[i];
				else if(GetComponent.<Renderer>().materials[i].HasProperty("_TintColor"))
					GetComponent.<Renderer>().materials[i].SetColor("_TintColor", m_OrigColors[i]);
			}
		}
	}
	else
	{
		for( i = 0; i < m_AffectedObj.GetComponent.<Renderer>().materials.length; i++)
		{
			if(	m_AffectedObj.GetComponent.<Renderer>().materials[i] != null && m_OrigMaterials != null)
			{
				m_AffectedObj.GetComponent.<Renderer>().materials[i].shader= m_OrigMaterials[i];
				if(m_AffectedObj.GetComponent.<Renderer>().materials[i].HasProperty("_Color"))
					m_AffectedObj.GetComponent.<Renderer>().materials[i].color = m_OrigColors[i];
				else if(m_AffectedObj.GetComponent.<Renderer>().materials[i].HasProperty("_TintColor"))
					m_AffectedObj.GetComponent.<Renderer>().materials[i].SetColor("_TintColor", m_OrigColors[i]);
			}
		}
	}
}