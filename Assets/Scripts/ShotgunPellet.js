#pragma strict
private var offset:Vector3;
function Start () {

	offset.x = Random.Range(-2, 2);
	offset.y = Random.Range(1, 2);
	

}

function OnEnable()
{
	transform.position = transform.parent.position;
}

function OnDisable()
{
	
	transform.position = transform.parent.position;
}

function Update () {

	transform.position += transform.parent.right * offset.x * 20 * Time.deltaTime + transform.parent.up * offset.y * 75 * Time.deltaTime;

}