#pragma strict
import Dice;


var m_RockShatterSound : AudioClip = null;
var m_RockParticles : GameObject = null;
var m_DustParticles : GameObject = null;
var m_Owner : GameObject = null;
var m_RespawnTime : float = 5;
var m_CrackedTexture : Texture2D = null;
var m_HP : int = 4;
private var m_RespawnTimer : float;
private var m_InitiaPos : Vector3;
private static var m_InstanceID : int = 0;

function Awake()
{
	m_RespawnTimer = -1;
	gameObject.name = "Rock"+ ++m_InstanceID;
}
function Start () {
	m_InitiaPos = transform.position;
}

function Update () {

	if(Network.isServer)
	{
		var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
		if(transform.position.y + Comp.m_Vel.y * Time.deltaTime < 0)
		{
			//ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
		}
		
		if(Comp.m_Vel.magnitude < 0.01)
		{
			Comp.m_Vel = Vector3(0,0,0);
			Comp.m_Accel = Vector3(0,0,0);
		}
		
	
		if(m_RespawnTimer > 0.0)
		{
			
			m_RespawnTimer -= Time.deltaTime;
			if(m_RespawnTimer <= 0)
			{
				ServerRPC.Buffer(networkView, "RespawnRock", RPCMode.All);
			}			
		}
	}
}

function OnTriggerEnter(other : Collider)
{
	//NOTE: powershots should always do 5 dmg
	if(Network.isClient)
		return;
	if(transform.parent == null)
	{	
		if(other.gameObject.tag == "Hives")
		{
			if(m_Owner != null && m_Owner.GetComponent(ItemDecorator) == null)
			{
				if(other.GetComponent(HiveScript).m_Owner != m_Owner)
				{
					networkView.RPC("DamageHive", RPCMode.All,other.gameObject.name, 25);
					ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);	
				}
			}
		}
		else
		if(other.gameObject.tag == "Water")
		{
			ServerRPC.Buffer(networkView, "DrownRock", RPCMode.All);	
		}
	}
}

@RPC
function DamageHive(hiveName:String, dmgAmt:int)
{
	var hive:GameObject = gameObject.Find(hiveName);
	hive.GetComponent(HiveScript).m_HP -= dmgAmt;
	if(hive.GetComponent(HiveScript).m_HP <= 0)
	{
		//destroy the hive
		Destroy(gameObject.Find(hiveName));
	}
	else
		hive.GetComponent(HiveScript).m_LifebarTimer = 2;
}

function OnCollisionEnter(coll : Collision)
{
	Debug.Log("hit");
	if(Network.isServer)
	{
		if(transform.parent == null)
		{
			var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
			if(Comp.m_Vel.magnitude != 0)
			{
				if(coll.gameObject.tag == "Terrain" || coll.gameObject.tag == "Trees" || coll.gameObject.tag == "Rocks" || coll.gameObject.tag == "Bears")
					ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
				else if(coll.gameObject.tag == "Player" && m_Owner != coll.gameObject)
				{
					ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
					coll.gameObject.networkView.RPC("Daze", RPCMode.All, false);
				}
			}
			else
			{
				 if(coll.gameObject.tag == "Player")
				 {
					// coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
				 }
			}	
			
			if(coll.gameObject.tag == "Explosion")
			{
				ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
			}
			else
			if(coll.gameObject.tag == "Hammer")
			{
				ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
			}
			else
			if(coll.gameObject.tag == "Bullets")
			{	
				if(m_HP == 3)
					ServerRPC.Buffer(networkView, "CrackRock", RPCMode.All);
				if(m_HP == 1 || coll.gameObject.GetComponent(BulletScript).m_PowerShot)
					ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
				m_HP--;
			}
			
			
		}
		else
		{
			if(coll.gameObject.tag == "Explosion")
			{
				ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
			}
			else
			if(coll.gameObject.tag == "Hammer")
			{
				ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
			}
			
		}
	}
}

function OnCollisionStay(coll : Collision)
{
		Debug.Log("hitstay");
	var player:GameObject = null;
	if(coll.gameObject.tag == "Player" )
	{
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
		//handle player specific logic if the player is us
		coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
		if(coll.gameObject == player)
		{	
			var txt : GameObject  = gameObject.Find("UseText");
			txt.transform.position = Camera.main.WorldToViewportPoint(transform.position);
			txt.transform.position.y += 0.04;
			txt.GetComponent(GUIText).enabled = true;
			txt.GetComponent(GUIText).text = "Use";
		}
	}
	else
	if(coll.gameObject.tag == "Explosion")
	{
		if(Network.isServer)
			ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
	}
	
	/*if(Network.isServer)
	{
		if(transform.parent == null)
		{
			
			var server:ServerScript = gameObject.Find("GameServer").GetComponent(ServerScript) as ServerScript;
			if(coll.gameObject.tag == "Player" && coll.gameObject == server.GetGameObject())
			{
				Debug.Log("serve");
				coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
				var txt : GameObject  = gameObject.Find("UseText");
				txt.transform.position = Camera.main.WorldToViewportPoint(transform.position);
				txt.transform.position.y += 0.04;
				txt.GetComponent(GUIText).enabled = true;
				txt.GetComponent(GUIText).text = "Use";
			}
			else
			if(coll.gameObject.tag == "Explosion")
			{
				ServerRPC.Buffer(networkView, "KillRock", RPCMode.All);
			}
			
		}
	}
	else
	{
		var client:ClientScript = gameObject.Find("GameClient").GetComponent(ClientScript) as ClientScript;
		if(coll.gameObject.tag == "Player" && coll.gameObject == client.GetGameObject())
		{
			Debug.Log("Client");
			coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
			txt  = gameObject.Find("UseText");
			txt.transform.position = Camera.main.WorldToViewportPoint(transform.position);
			txt.transform.position.y += 0.04;
			txt.GetComponent(GUIText).enabled = true;
			txt.GetComponent(GUIText).text = "Use";
		}
	}*/
}

@RPC function CrackRock()
{
	var TempTex : Texture2D = renderer.material.mainTexture;
	renderer.material.mainTexture = m_CrackedTexture;
	m_CrackedTexture = TempTex;
	
	var go : GameObject = gameObject.Instantiate(m_RockParticles);
	go.transform.position = transform.position;
	go.transform.position.y = 0;
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

function OnDestroy()
{
	
}

@RPC function KillRock()
{
	Debug.Log("Killing Rock " + gameObject.name);
	GetComponent(BoxCollider).enabled = false;
	GetComponent(TrailRenderer).enabled = false;
	
	AudioSource.PlayClipAtPoint(m_RockShatterSound, Camera.main.transform.position);
	
	if(Network.isServer)
	{
		//Since the rock is destroying there is no reason to keep its messages in the buffer up to this point
		//hence we clear them out
		ServerRPC.DeleteFromBuffer(gameObject);
		var InstType : GameObject = GetComponent(ItemDropScript).DropItem();
		if(InstType != null)
		{
			var count : int =1;
			if(InstType.name == "Coin")
			{
				//perform a damage roll to see how many coins we should spawn
				var sum : int = Dice.RollDice(2,6);
				
				if(sum == 2 || sum == 3)
				{
					count = 10;
				}
				else if(sum == 5 || sum == 4)
				{
					count = 5;
				}
				else if(sum == 6 || sum == 8)
				{
					count = 3;
				}
			}
			
			
			for(var i : int = 0; i < count; i++)
			{
				var Quat = Quaternion.AngleAxis(360.0/count * i, Vector3.up);
				var vel =  Quat*Vector3(0,0,1) ;//: Vector2 = Random.insideUnitCircle.normalized*50;
				var viewID : NetworkViewID= Network.AllocateViewID();
				var go1 : GameObject = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate(InstType.name,"", transform.position + Vector3(0,6,0), Quaternion.identity, viewID ,  0);
				go1.GetComponent(UpdateScript).m_Vel = vel.normalized * Random.Range(20, 50);
				//go1.GetComponent(UpdateScript).m_Vel.z = vel.y;
				go1.GetComponent(UpdateScript).m_Vel.y = Random.Range(20, 100);;
				ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, InstType.name,"", transform.position+ Vector3(0,6,0), Quaternion.identity, viewID, 0);
			}
		}
		
	}
	

	for (var child : Transform in transform)
	{
		child.gameObject.active = false;
	}
	renderer.enabled = false;
	m_RespawnTimer = m_RespawnTime;
	
	var go : GameObject = gameObject.Instantiate(m_RockParticles);
	go.transform.position = transform.position;
	Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
	
	go= gameObject.Instantiate(m_DustParticles);
	go.transform.position = transform.position;
	
	
	transform.eulerAngles = Vector3(0,0,0);
	var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	Comp.m_Vel = Vector3(0,0,0);
	Comp.m_Accel = Vector3(0,0,0);
	m_Owner = null;
	
	transform.position = m_InitiaPos;
	Debug.Log("setting position to " +m_InitiaPos);
}

@RPC function DrownRock()
{
	Debug.Log("Drowning Rock " + gameObject.name);
	if(Network.isServer)
	{
		//Since the rock is destroying there is no reason to keep its messages in the buffer up to this point
		//hence we clear them out
		ServerRPC.DeleteFromBuffer(gameObject);
	}
	renderer.enabled = false;
	GetComponent(BoxCollider).enabled = false;
	GetComponent(TrailRenderer).enabled = false;
	
	for (var child : Transform in transform)
	{
		child.gameObject.active = false;
	}
	//renderer.enabled = false;
	m_RespawnTimer = m_RespawnTime;
	
	transform.eulerAngles = Vector3(0,0,0);
	var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	// Comp.m_Vel = Vector3(0,0,0);
	// Comp.m_Accel = Vector3(0,0,0);
	m_Owner = null;
	
	//transform.position = m_InitiaPos;
}

@RPC function RespawnRock()
{
	transform.position = m_InitiaPos;
	transform.eulerAngles = Vector3(0,0,0);
	var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	Comp.m_Vel = Vector3(0,0,0);
	Comp.m_Accel = Vector3(0,0,0);
	m_Owner = null;
	if(m_HP < 3)
	{
		var TempTex : Texture2D = renderer.material.mainTexture;
		renderer.material.mainTexture = m_CrackedTexture;
		m_CrackedTexture = TempTex;
	}
	
	m_HP = 4;
	
	collider.enabled = true;
	renderer.enabled = true;
	for (var child : Transform in transform)
	{
		child.gameObject.active = true;
	}
	
	var go : GameObject = gameObject.Instantiate(m_DustParticles);
	go.transform.position = transform.position;
	go.transform.position.y = 0;
	
	animation.Play();
	gameObject.AddComponent(ObjectRespawnDecorator);
	if(Network.isServer)
		ServerRPC.Buffer(networkView, "NetworkDeactivate", RPCMode.All);	
}