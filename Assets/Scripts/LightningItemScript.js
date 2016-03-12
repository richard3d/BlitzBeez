#pragma strict

private static var m_InstanceID : int = 0;
function Awake()
{
	gameObject.name = "LightningItem"+ ++m_InstanceID;
}
function Start () {

}

function Update () {
	transform.eulerAngles.x = 290.0;
}

function OnCollisionEnter(coll : Collision)
{
	var other : Collider = coll.collider;
	if(other.gameObject.tag == "Player")
	{
		GetComponent(ItemScript).OnItemCollisionEnter(coll);
		GetComponent.<Animation>().Stop();
		//Destroy(GetComponent(UpdateScript));
		//Destroy(GetComponent(ItemScript));
		//transform.parent = other.gameObject.transform;
		//transform.position = Vector3(0,6,0);
		//animation.Play("GetBomb");
		GetComponent(SphereCollider).enabled = false;
		
		
	//	ServerRPC.Buffer(networkView, "GetCoin", RPCMode.All, other.gameObject.name);
	}
	else
	{
		GetComponent(ItemScript).OnItemCollisionEnter(coll);
	}
}




