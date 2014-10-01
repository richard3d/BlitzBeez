#pragma strict

var m_HiveInstance : GameObject = null; //the hive instance to use to spawn a hive when 3 honey combs have been collected
private static var m_InstanceID : int = 0;


function Awake()
{
	gameObject.name = "Honeycomb"+ ++m_InstanceID;
	if(transform.parent != null)
	{
		GetComponent(SphereCollider).enabled = false;
	}
}

function OnCollisionEnter(coll : Collision)
{
	if(Network.isClient)
		return;
	var other : Collider = coll.collider;
	if(other.gameObject.tag == "Player")
	{
		//other.GetComponent(BeeScript).m_HoneycombCount++;
		// if(other.GetComponent(BeeScript).m_HoneycombCount == 1)
		// {
		
			// GetComponent(SphereCollider).enabled = false;
			
		
			// // var go	= gameObject.Instantiate(m_HiveInstance);
			// // go.transform.eulerAngles.y = 0;
			
			// // other.gameObject.AddComponent(ItemDecorator);
			// // other.gameObject.GetComponent(ItemDecorator).SetItem(go, Vector3(0,1,12), Vector3(-90,0,-180), false, true);
			// // other.gameObject.GetComponent(ItemDecorator).m_MaxSpeed = other.GetComponent(UpdateScript).m_DefaultMaxSpeed;
			
			
		// }
		

		// if(other.GetComponent(BeeScript).m_HoneycombCount <= 3)
		// {
			// var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript);
			// ServerRPC.Buffer(server.m_SyncMsgsView, "NetworkDestroy", RPCMode.All, gameObject.name);
		// }
	}
}