#pragma strict
var m_PickupSound : AudioClip = null;
private static var m_InstanceID : int = 0;
function Awake()
{
	gameObject.name = "Coin"+ ++m_InstanceID;
}

function Start () {


}

function Update () {

	

	
}

function OnCollisionEnter(coll : Collision)
{
	var other : Collider = coll.collider;
	if(other.gameObject.tag == "Player")
	{
		animation.Stop();
		Destroy(GetComponent(UpdateScript));
		Destroy(GetComponent(ItemScript));
		transform.rotation = Quaternion.identity;
		transform.position = other.gameObject.transform.position + Vector3 (0,6,0);
		animation.Play("GetCoin");
		GetComponent(SphereCollider).enabled = false;
		
		if(Network.isClient)
			return;
		ServerRPC.Buffer(networkView, "GetCoin", RPCMode.All, other.gameObject.name);
		
	}
	else
	{
		GetComponent(ItemScript).OnItemCollisionEnter(coll);
	}
	
	
	
}

@RPC
function GetCoin(name : String)
{
	var bee:GameObject = gameObject.Find(name);
	bee.GetComponent(BeeScript).m_Money++;
	if(bee.GetComponent(BeeDashDecorator) != null)
	{
		bee.GetComponent(BeeDashDecorator).Disable();
		Destroy(bee.GetComponent(BeeDashDecorator));
	
	
	
	var closestCoin : GameObject = null;
	var dist = 99999;
	var coins :GameObject [] = GameObject.FindGameObjectsWithTag("Coins");
	for(var coin:GameObject in coins)
	{
		if((bee.transform.position - coin.transform.position).magnitude < dist && coin != gameObject && !coin.animation.IsPlaying("GetCoin"))
		{
			dist = (bee.transform.position - coin.transform.position).magnitude;
			closestCoin = coin;
		}
	}
	
	if(closestCoin != null)
	{
		bee.GetComponent(UpdateScript).m_Vel = (closestCoin.transform.position - bee.transform.position).normalized * bee.GetComponent(UpdateScript).m_MaxSpeed;
		bee.AddComponent(BeeDashDecorator);
	}
	
	}
	
	AudioSource.PlayClipAtPoint(m_PickupSound, Camera.main.transform.position);
}

function KillCoin()
{
	if(Network.isClient)
		return;
	var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript);
	ServerRPC.Buffer(server.m_SyncMsgsView, "NetworkDestroy", RPCMode.All, gameObject.name);
		
		// for(var child : Transform in transform)
		// {
			// gameObject.Destroy(child.gameObject);
		// }
}

function OnDestroy()
{
	
}