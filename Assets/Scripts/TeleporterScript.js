#pragma strict
var m_ExitTeleporter : GameObject;

function Start () {

}

function Update () {

}

function OnCollisionEnter (coll:Collision)
{
	coll.collider.transform.position = m_ExitTeleporter.transform.position+Vector3.up*6+Vector3.right*10;
	
}