#pragma strict
private static var m_InstanceID : int = 0;
var m_FireEffect : GameObject = null;
var m_LeafParticles:GameObject = null;
var m_IsBurning: boolean = false;
function Awake()
{
	gameObject.name = "Tree"+ ++m_InstanceID;
}

function Start () {

}

function Update () {

}

function OnTriggerStay(coll : Collider)
{
	var player:GameObject = null;

	if(coll.gameObject.tag == "Player" )
	{		
		
		//handle player specific logic if the player is us
		if(coll.gameObject.GetComponent(ItemDecorator) == null && coll.gameObject.GetComponent(TreeHideDecorator) == null)
		{
			coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
			if(NetworkUtils.IsControlledGameObject(coll.gameObject))
			{	
				var txt : GameObject  = gameObject.Find("GUITexture");	
				txt.transform.position = Camera.main.WorldToViewportPoint(coll.gameObject.transform.position);
				txt.transform.position.y += 0.03;
				if(!txt.GetComponent(GUITexture).enabled)
				{
					//txt.GetComponent(GUITexture).enabled = true;
					txt.GetComponent.<Animation>().Play();
				}
			}
		}
		else
		{
			if(NetworkUtils.IsControlledGameObject(coll.gameObject))
			{
				txt  = gameObject.Find("GUITexture");	
				txt.GetComponent(GUITexture).enabled = false;
			}
		}
	}
}

function OnBulletCollision(coll:BulletCollision)
{
	if(Network.isServer)
	{
	
	}
	
	GameObject.Instantiate(m_LeafParticles,coll.hit.point, Quaternion.identity);
}


function OnTriggerEnter(coll : Collider)
{
	if(!Network.isServer)
		return;
	if(coll.gameObject.tag == "Player")
	{		
		//burn the player if the fire animation is playing
		if(GetComponent.<Animation>().isPlaying && coll.gameObject.GetComponent(BurningDecorator) == null)
		{
			if(coll.gameObject.GetComponent(BeeScript).m_HP-1 > 0)
				coll.gameObject.GetComponent.<NetworkView>().RPC("Burn", RPCMode.All);
			else	
				coll.gameObject.GetComponent(BeeScript).KillAndRespawn(true);
		}
	}
}

function OnTriggerExit(coll : Collider)
{
	if(coll.gameObject.tag == "Player")
	{	
		//code to handle if the player is our controlling player
		if(NetworkUtils.IsControlledGameObject(coll.gameObject))
		{
			var txt : GameObject  = gameObject.Find("GUITexture");	
			txt.GetComponent(GUITexture).enabled = false;
		}
		coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
	}
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
				//player.networkView.RPC("RemoveTreeDecorator", RPCMode.All, -diff);
			}
		 }
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
				ServerRPC.Buffer(player.GetComponent.<NetworkView>(), "KillBee", RPCMode.All, true);
				//player.networkView.RPC("RemoveTreeDecorator", RPCMode.All, -diff);
				
			}
		}
	}
    
}

@RPC function BurnPlayer(name:String)
{
	var go:GameObject = GameObject.Find(name);
	if(go == null)
		return;
	go.GetComponent(BeeScript).SetHP(go.GetComponent(BeeScript).m_HP-1);
				
	var fire:GameObject = GameObject.Instantiate(m_FireEffect, go.transform.position, Quaternion.identity);
	fire.name = "fire";
	//fire.GetComponent(ParticleSystem).simulationSpace = ParticleSystemSimulationSpace.World;
	fire.transform.parent = go.transform;
	fire.transform.position = go.transform.position;
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
	GetComponent.<Animation>().Stop();
	GetComponent.<Animation>().Play();	
}

function OnCollisionStay(coll : Collision)
{
	
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
			var txt : GameObject  = gameObject.Find("GUITexture");	
			txt.GetComponent(GUITexture).enabled = false;
		}
		coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
	}
	
}