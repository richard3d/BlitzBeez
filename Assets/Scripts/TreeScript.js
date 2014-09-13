#pragma strict
private static var m_InstanceID : int = 0;
var m_FireEffect : GameObject = null;
var m_IsBurning: boolean = false;
function Awake()
{
	gameObject.name = "Tree"+ ++m_InstanceID;
}

function Start () {

}

function Update () {

}

function OnCollisionEnter(coll : Collision)
{

	if(Network.isClient)
		return;
	if(coll.gameObject.GetComponent(BeeDashDecorator))
	{
		
		var diff : Vector3 = coll.transform.position - transform.position;
		diff.Normalize();
		 // for(var child : Transform in transform)
		 // {
			// child.parent = null;
			// var pos : Vector3 = GetComponent(CapsuleCollider).center;
			// pos.y = 0;
			// pos = Vector3.Scale(pos, transform.localScale);
			// child.transform.position = pos + transform.position  - diff *GetComponent(CapsuleCollider).radius * transform.localScale.x +Vector3.up* 40;
			// var vel : Vector3 = child.transform.position - transform.position;
			// vel.y = 0;
			// child.GetComponent(UpdateScript).m_Vel = vel.normalized * 48;
			// child.GetComponent(SphereCollider).enabled = true;
			// child.GetComponent(UpdateScript).MakeNetLive(child.transform.position, child.transform.rotation, child.GetComponent(UpdateScript).m_Vel);
			
		 // }	

		 var players : GameObject[] = gameObject.FindGameObjectsWithTag("Player");
		 for(var player : GameObject in players)
		 {
			if(player.GetComponent(TreeHideDecorator) != null &&
				player.GetComponent(TreeHideDecorator).m_Tree == gameObject)
			{
				diff.y = 0;
				player.networkView.RPC("RemoveTreeDecorator", RPCMode.All, -diff);
			}
		 }
	}
	
	if(coll.gameObject.tag == "Player")
	{
		coll.gameObject.GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
		coll.gameObject.GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	}
	
	
	if(coll.gameObject.tag == "Explosion")
	{
		//networkView.RPC("Burn", RPCMode.All);
		// var go : GameObject = gameObject.Instantiate(m_FireEffect);
		// go.transform.parent = gameObject.transform;
		// go.transform.position = gameObject.transform.position;
		// go.transform.position.y = 7;
		// animation.Play();
		if(Network.isServer)
			GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView.RPC("SendRPC", RPCMode.All, gameObject.name, "Burn");
		players  = gameObject.FindGameObjectsWithTag("Player");
		for(player  in players)
		{
			if(player.GetComponent(TreeHideDecorator) != null &&
				player.GetComponent(TreeHideDecorator).m_Tree == gameObject)
			{
				diff.y = 0;
				player.networkView.RPC("RemoveTreeDecorator", RPCMode.All, -diff);
				ServerRPC.Buffer(player.networkView, "SetHP", RPCMode.All, player.GetComponent(BeeScript).m_HP-3);
			}
		}
	}
    
}

@RPC function Burn()
{
	
	for(var i = 0; i < transform.childCount; i++)
	{
		if(transform.GetChild(i).tag == "Fire")
			Destroy(transform.GetChild(i).gameObject);
	}
	var go : GameObject = gameObject.Instantiate(m_FireEffect);
	go.transform.parent = gameObject.transform;
	go.transform.position = gameObject.transform.position;
	go.transform.position.y = 7;
	animation.Stop();
	animation.Play();
	
}

function OnCollisionStay(coll : Collision)
{
	if(coll.gameObject.tag == "Player")
	{
		var player:GameObject = null;
		if(Network.isServer)
		{
			var server:ServerScript = gameObject.Find("GameServer").GetComponent(ServerScript) as ServerScript;
			player = server.GetGameObject();
		}
		else
		{
			var client:ClientScript = gameObject.Find("GameClient").GetComponent(ClientScript) as ClientScript;
			player = client.GetGameObject();
		}
		
		coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
		//handle player specific logic if the player is us
		if(coll.gameObject == player)
		{
			
			var txt : GameObject  = gameObject.Find("UseText");
			txt.transform.position = Camera.main.WorldToViewportPoint(transform.position);
			txt.transform.position.y += 0.04;
			txt.GetComponent(GUIText).enabled = true;
			txt.GetComponent(GUIText).text = "Use";
		}
		//handle standard collision if the player is not us
		if(animation.isPlaying && Network.isServer)
		{
			ServerRPC.Buffer(coll.gameObject.networkView, "SetHP", RPCMode.All, coll.gameObject.GetComponent(BeeScript).m_HP-3);
		}
		if(coll.gameObject.GetComponent(BeeDashDecorator) != null)
		{
			coll.gameObject.GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
			coll.gameObject.GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
		}
		
	}
}

function OnCollisionExit(coll : Collision)
{
	
	if(coll.gameObject.tag == "Player")
	{
		var player:GameObject = null;
		if(Network.isServer)
		{
			var server:ServerScript = gameObject.Find("GameServer").GetComponent(ServerScript) as ServerScript;
			player = server.GetGameObject();
		}
		else
		{
			var client:ClientScript = gameObject.Find("GameClient").GetComponent(ClientScript) as ClientScript;
			player = client.GetGameObject();
		}
		
		//code to handle if the player is our controlling player
		if(coll.gameObject == player)
		{
			
			var txt : GameObject  = gameObject.Find("UseText");	
			txt.GetComponent(GUIText).enabled = false;
		}
		coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
	}
	
}