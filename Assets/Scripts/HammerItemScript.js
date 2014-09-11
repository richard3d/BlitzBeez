#pragma strict

private static var m_InstanceID : int = 0;
function Awake()
{
	gameObject.name = "HammerItem"+ ++m_InstanceID;
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
		GetHammerItem();
	}
	else
	{
		GetComponent(ItemScript).OnItemCollisionEnter(coll);
	}
}

function GetHammerItem()
{
	if(Network.isClient)
			return;
		
	var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript);
	ServerRPC.Buffer(server.m_SyncMsgsView, "NetworkDestroy", RPCMode.All, gameObject.name);	
}

