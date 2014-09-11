#pragma strict
var m_PickupSound : AudioClip = null;
private static var m_InstanceID : int = 0;
function Awake()
{
	gameObject.name = "BombItem"+ ++m_InstanceID;
}
function Start () {

}

function Update () {
	transform.eulerAngles.x = 54.68;
	transform.eulerAngles.y = 180.13;
}

function OnCollisionEnter(coll : Collision)
{
	var other : Collider = coll.collider;
	if(other.gameObject.tag == "Player")
	{
		GetComponent(ItemScript).OnItemCollisionEnter(coll);
		animation.Stop();
		//Destroy(GetComponent(UpdateScript));
		//Destroy(GetComponent(ItemScript));
		//transform.parent = other.gameObject.transform;
		//transform.position = Vector3(0,6,0);
		//animation.Play("GetBomb");
		GetComponent(SphereCollider).enabled = false;
		GetBombItem();
		
	//	ServerRPC.Buffer(networkView, "GetCoin", RPCMode.All, other.gameObject.name);
	}
	else
	{
		GetComponent(ItemScript).OnItemCollisionEnter(coll);
	}
	
	
	
}


function GetBombItem()
{

	if(Network.isClient)
			return;
		
		
}

