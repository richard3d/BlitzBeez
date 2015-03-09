#pragma strict
var m_GUISkin:GUISkin;
function Start () {

	for(var child:Transform in transform)
	{
		child.gameObject.layer = gameObject.layer;
	}
}

function Update () {

}

function OnGUI()
{
	
}