#pragma strict



//this script makes bees flash a certain color
private var m_OrigColor:Color;
private var m_OrigColor2:Color;
function Start () {

	m_OrigColor = renderer.material.color;
	m_OrigColor2 = renderer.materials[1].color;
	yield SwitchColor(7, 0.08);
}

function Update () {

 

}

function SwitchColor(num:int,time:float)
{

	for(var i:int = 0; i < num; i++)
	{
		renderer.material.color  = renderer.material.color == Color.white ?  m_OrigColor : Color.white;
		renderer.materials[1].color  = renderer.materials[1].color == Color.white ?  m_OrigColor2 : Color.white;
		yield WaitForSeconds(time);
	}
	Destroy(this);
}

function OnDestroy()
{
	renderer.material.color = m_OrigColor;
	renderer.materials[1].color = m_OrigColor2;
}