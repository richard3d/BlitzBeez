#pragma strict

function Start () {

yield Squirt();

}

function Squirt()
{
	while(true)
	{
	yield WaitForSeconds (0.5);
	transform.RotateAround(transform.position,Vector3.up,10 );
	}
}

function Update () {

}