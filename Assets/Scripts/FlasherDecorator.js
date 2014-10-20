#pragma strict

public var m_Color:Color = Color.white;
public var m_NumberOfFlashes:int = 7;
public var m_FlashDuration:float = 0.08;
//this script makes bees flash a certain color
private var m_OrigColors:Color[];

function Start () {

	m_OrigColors = new Color[ renderer.materials.length];
	
	for( var i:int = 0; i < renderer.materials.length; i++)
	{
		m_OrigColors[i] = renderer.materials[i].color;
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
		 renderer.materials[i].color = m_OrigColors[i];
	}
}