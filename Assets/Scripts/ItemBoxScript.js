#pragma strict

var m_DestroySound:AudioClip = null;
var m_RespawnTime : float = 10;
var m_PoofParticles : GameObject = null;
var m_Bounce : boolean = true;
var m_HP:int = 3;
private var m_RespawnTimer : float;

public var m_OriginalPos : Vector3;

function Awake()
{
	m_RespawnTimer = -1;
}

function Start () {

	m_OriginalPos = transform.position;
}

function Update () {

	if(m_Bounce)
		transform.position.y = m_OriginalPos.y + Mathf.Sin(Time.time*8);
		

	
	if(Network.isServer)
	{
		if(m_RespawnTimer > 0.0)
		{
			
			m_RespawnTimer -= Time.deltaTime;
			if(m_RespawnTimer <= 0)
			{
				networkView.RPC("RespawnItem", RPCMode.All);
				
			}
		}
	}
}

function OnBulletCollision(coll:BulletCollision)
{
	if(Network.isServer)
	{
		if(coll.bullet.GetComponent(BulletScript).m_PowerShot)
			networkView.RPC("SetHP", RPCMode.All, m_HP-3);
		else
			networkView.RPC("SetHP", RPCMode.All, m_HP-1);
	}
}


function OnTriggerEnter (coll : Collider)
{
	if(Network.isServer)
	{
		if(coll.gameObject.tag == "Player")
		{
		
			//determine the item to give to the player
			//remove this gameobject
			//GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView.RPC("Hide", RPCMode.All);
			networkView.RPC("KillItem", RPCMode.All);
			
			coll.gameObject.AddComponent(ControlDisablerDecorator);
			coll.gameObject.GetComponent(ControlDisablerDecorator).SetLifetime(0.1);
			coll.gameObject.GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
			coll.gameObject.GetComponent(UpdateScript).m_Vel= Vector3(0,0,0);
		}
		else if(coll.gameObject.tag == "Hammer")
		{
			networkView.RPC("KillItem", RPCMode.All);
		}
	}
}

function OpenEffect()
{
	var go : GameObject = gameObject.Instantiate(m_PoofParticles);
	go.transform.position = transform.position;
	renderer.enabled = false;
	if(Network.isServer)
	{
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
					count = 3;
				}
				else if(sum == 5 || sum == 4)
				{
					count = 2;
				}
				else if(sum == 6 || sum == 8)
				{
					count = 1;
				}
			}
			for(var i : int = 0; i < count; i++)
			{
				var vel : Vector3 = Vector3(0,0,1);
				var angle : float = (360.0/count) * i;
				var rot : Quaternion  = Quaternion.AngleAxis(angle, Vector3.up);
				vel = rot*vel;
				vel = vel.normalized * 50;
				if(i == 0)
					vel = Vector3(0,0,0);
				//vel= Random.insideUnitCircle.normalized * 50;
				//vel.z = vel.y;
				vel.y= 50;
				var viewID : NetworkViewID= Network.AllocateViewID();
				var go1 : GameObject = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate(InstType.name,"", vel.normalized * 5 + transform.position + Vector3(0,transform.localScale.y, 0), Quaternion.identity, viewID ,  0);
				
				go1.GetComponent(UpdateScript).m_Vel = vel;
				
				ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, InstType.name,go1.name, transform.position+ Vector3(0,transform.localScale.y, 0), Quaternion.identity, viewID, 0);
				go1.GetComponent(UpdateScript).MakeNetLive(); 
			}
		}
	}	
}

@RPC function SetHP(hp:int)
{
	m_HP = hp;
	if(m_HP == 0)
	{
		
		KillItem();
	}
	else
	{
		if(GetComponent(FlasherDecorator) == null)
		{
			gameObject.AddComponent(FlasherDecorator);
			GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
			GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
		}
	}	
}

@RPC function KillItem()
{
	GetComponent(BoxCollider).enabled = false;
	
	for (var child : Transform in transform)
	{
		child.gameObject.active = false;
	}
	
	m_RespawnTimer = m_RespawnTime;
	m_Bounce = false;
	animation.Play("ItemBoxOpen");
	AudioSource.PlayClipAtPoint(m_DestroySound, Camera.main.transform.position);
	//renderer.material.shader = Shader.Find("Particles/Additive");
}

@RPC function RespawnItem()
{
	GetComponent(BoxCollider).enabled = true;
	m_Bounce = true;
	m_HP = 3;
	var go : GameObject = gameObject.Instantiate(m_PoofParticles);
	go.transform.position = transform.position;
	go.transform.position.y = m_OriginalPos.y ;
	transform.localScale = Vector3(8,8,8);
	renderer.enabled = true;
	for (var child : Transform in transform)
	{
		child.gameObject.active = true;
	}
	//renderer.material.shader = Shader.Find("Unlit/Texture");
	animation.Play("ItemBoxRespawn");
}