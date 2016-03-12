#pragma strict

var m_Owner : GameObject = null;
var m_DamageEffect :GameObject = null;
var m_ExplosionParticles :GameObject = null;
var m_RespawnParticles : GameObject = null;
var m_Pedestal : GameObject = null;
private var m_InitPos : Vector3;
private static var m_InstanceID : int = 0;

var m_MaxHP : int = 100;
var m_HP : int = 100;
var m_BaseHP : int = 100;		 //(the starting HP for the hive
var m_LifeTexture:Texture2D = null;
var m_LifeBGTexture:Texture2D = null;
var m_LifebarTimer : float = 1;
function Awake()
{
	m_LifebarTimer = 0;
	name = "Hive"+ ++m_InstanceID;
}

function Start () {

	m_HP = m_BaseHP;
	if(GetComponent.<Animation>()["SpawnHive"] != null)
		GetComponent.<Animation>().Play("SpawnHive");
	m_InitPos = transform.position;
	if(m_RespawnParticles != null)
	{
		var go : GameObject = gameObject.Instantiate(m_RespawnParticles);
		go.transform.position = transform.position;
	}
	

}

function Update () {	
	if(!GetComponent.<Animation>().isPlaying)
		transform.position.y = m_InitPos.y + Mathf.Sin(Time.time*6) *2;
}

function OnGUI()
{
	if(m_LifebarTimer > 0 )
	{
		m_LifebarTimer -= Time.deltaTime;
		var players:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
		for(var player:GameObject in players)
		{
			var cam:Camera = player.GetComponent(BeeScript).m_Camera.GetComponent.<Camera>();
			
			var camPos:Vector2 = Vector2(cam.rect.x*Screen.width,Mathf.Abs(cam.rect.y - 0.5)*Screen.height);
			if(cam.GetComponent.<Camera>().rect.y == 0.0 &&  cam.GetComponent.<Camera>().rect.height == 1)
				camPos.y = 0;
			var bottom:float = camPos.y +cam.rect.height*Screen.height;
			var scrPos:Vector3 = cam.WorldToScreenPoint(transform.position+ Vector3.up * transform.localScale.y * 1.25);
			
			if((Screen.height - scrPos.y > camPos.y) && (Screen.height - scrPos.y < bottom))
			{
				var height = 12;
				var width = 48;
			
				var maxHP:float = m_MaxHP;
				var percent:float = m_HP/maxHP;
			
				GUI.DrawTexture(Rect(scrPos.x- width*0.5, Screen.height - scrPos.y - height*0.5, width, height), m_LifeBGTexture);
				GUI.color = Color(0.2,0.2,0.2,1.0);
				GUI.DrawTexture(Rect(scrPos.x- width*0.5, Screen.height - scrPos.y - height*0.5, width, height), m_LifeTexture);
				GUI.color = Color.red;
				GUI.DrawTexture(Rect(scrPos.x- width*0.5, Screen.height - scrPos.y - height*0.5, width*percent, height), m_LifeTexture);
				GUI.color = Color.white;
			}
		}
	}
	
		
}

@RPC
function DamageHive(dmgAmt:int)
{
	m_HP -= dmgAmt;
	
	var perc:float = m_HP;
	perc = perc / m_BaseHP;
	
	if(perc <= .75 && transform.Find("HiveFire") == null)
	{
		var effect = GameObject.Instantiate(m_DamageEffect, transform.position, Quaternion.identity);
		effect.name = "HiveFire";
		effect.transform.parent = transform;
		effect.Find("Fire").GetComponent(ParticleSystem).Clear();
		effect.Find("Fire").GetComponent(ParticleSystem).Stop();
		effect.Find("Sparks").GetComponent(ParticleSystem).Stop();
	
	}
	if(perc <= 0.50)
	{
		transform.Find("HiveFire/Fire").GetComponent(ParticleSystem).Play();
	}
	if(perc <= 0.25)
	{
		transform.Find("HiveFire/Sparks").GetComponent(ParticleSystem).Play();
	}
	
	if(GetComponent(FlasherDecorator) == null)
	{
		gameObject.AddComponent(FlasherDecorator);
		GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
		GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
	}
	
	if(m_HP <= 0)
	{
		Time.timeScale = 0.15;
		//destroy the hive
		if(m_ExplosionParticles != null )
		{
			var go:GameObject =  gameObject.Instantiate(m_ExplosionParticles);
			go.transform.position = transform.position;
		}
		
		ShowRecursive(transform, false);
		
		//wait just a tad for effect and then end the match
		yield WaitForSeconds(1.5);
		Time.timeScale = 1;
		if(Network.isServer)
		{
			if(GetComponent(RespawnScript).m_TeamOwner == 0)
				ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView, "EndMatch",RPCMode.All, 1); 
			else
				ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView, "EndMatch",RPCMode.All, 0); 
		}
		
		
		//Destroy(gameObject);
	}
	else
		m_LifebarTimer = 4;
}

function ShowRecursive(p:Transform, show:boolean)
{
	if(p.gameObject.GetComponent.<Renderer>() != null)
			p.gameObject.GetComponent.<Renderer>().enabled = show;
	for(var t:Transform in p)
	{
		if(t.gameObject.GetComponent.<Renderer>() != null)
			t.gameObject.GetComponent.<Renderer>().enabled = show;
		ShowRecursive(t, show);
	}
}

function OnBulletCollision(coll:BulletCollision)
{
	// if(!Network.isServer)
		// return;
	// if(coll.bullet.GetComponent(BulletScript).m_Owner.GetComponent(BeeScript).m_Team != GetComponent(RespawnScript).m_TeamOwner)
	// {
		// if(coll.bullet.GetComponent(BulletScript).m_PowerShot)
			// coll.bullet.networkView.RPC("DamageHive", RPCMode.All,gameObject.name, 5);
		// else
			// coll.bullet.networkView.RPC("DamageHive", RPCMode.All,gameObject.name, 1);
	// }
}

function OnTriggerStay(other : Collider)
{
	if(other.gameObject.tag == "Player" && other.gameObject == m_Owner)
	{
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
		
		if(other.gameObject.GetComponent(HoneyDepositDecorator) == null && other.gameObject.GetComponent(BeeScript).m_PollenCount == 0)
		{
			if(NetworkUtils.IsControlledGameObject(other.gameObject))
			{
				var txt : GameObject  = gameObject.Find("UseText");
				txt.transform.position = Camera.main.WorldToViewportPoint(transform.position);
				txt.transform.position.y += 0.04;
				//txt.GetComponent(GUIText).enabled = true;
				//txt.GetComponent(GUIText).text = "Enter Hive";
			}
		}
		//call cash in on the bee
		if(Network.isServer)
			ServerRPC.Buffer(other.gameObject.GetComponent.<NetworkView>(),"PollenCashIn", RPCMode.All, other.gameObject.name, gameObject.name);
			///other.gameObject.networkView.RPC("PollenCashIn", RPCMode.All, other.gameObject.name, gameObject.name);
	}
	
}

function OnTriggerEnter(other:Collider)
{
	if (other.gameObject.tag == "Explosion")
	{
		if(other.GetComponent(BombExplosionScript).m_Owner != null && other.GetComponent(BombExplosionScript).m_Owner != m_Owner)
		{
			if(Network.isServer && m_HP > 0)
			{	
				m_HP -= m_BaseHP/2;
				ServerRPC.Buffer(m_Pedestal.GetComponent.<NetworkView>(), "SetHiveHP",RPCMode.All,name, m_HP);	//we do this on the pedestal because it actually has a networkview (hives do not)
			}
		}
	}
	else if (other.gameObject.tag == "Hammer")
	{
		if(other.GetComponent(HammerScript).m_Owner != null && other.GetComponent(HammerScript).m_Owner != m_Owner)
		{
			if(Network.isServer && m_HP > 0)
			{	
				m_HP -= m_BaseHP/4;
				ServerRPC.Buffer(m_Pedestal.GetComponent.<NetworkView>(), "SetHiveHP",RPCMode.All,name, m_HP);
			}
		}
	}
	else if (other.gameObject.tag == "Rocks")
	{
		if(m_Owner != null && m_Owner.GetComponent(ItemDecorator) == null)
		{
			if(other.GetComponent(RockScript).m_Owner != m_Owner && other.GetComponent(RockScript).m_Owner.GetComponent(ItemDecorator) == null)
			{
				if(Network.isServer && m_HP > 0)
				{	
					m_HP -= m_BaseHP/4;
					ServerRPC.Buffer(m_Pedestal.GetComponent.<NetworkView>(), "SetHiveHP",RPCMode.All,name, m_HP);
				}
			
			}
		}
	}
	
	
	
	
}

function OnTriggerExit(other : Collider)
{
	if(other.gameObject.tag == "Player")
	{
		var txt : GameObject  = gameObject.Find("UseText");
		txt.GetComponent(GUIText).enabled = false;
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
		
	
		
	}
}

function OnDestroy()
{
	if(m_Pedestal != null)
	{
		m_Pedestal.GetComponent(PollenNetworkScript).m_Owner = null;
		m_Pedestal.GetComponent(HivePedestalScript).m_Activated = false;
		m_Pedestal.GetComponent(HivePedestalScript).m_Hive = null;
		m_Pedestal.GetComponent.<Renderer>().material.mainTexture = m_Pedestal.GetComponent(HivePedestalScript).m_TempTexture;
	}
	
	if(m_ExplosionParticles != null && m_HP <= 0)
	{
		var go:GameObject =  gameObject.Instantiate(m_ExplosionParticles);
		go.transform.position = transform.position;
	}
}

//kinda funky but this gets called from the pedestal since it actually has a network view
function SetHP(hp:int)
{
	m_HP = hp;
	if(m_HP <= 0)
	{
		//technically we should never be negative, but just in case
		m_HP = 0;
	
		
		
		//CLEAN UP
		//if(m_Owner != null)
		//	m_Owner.networkView.RPC("RemoveBeesFromSwarm", RPCMode.All, gameObject.name, GetComponentInChildren(ParticleEmitter).particleCount);
		m_Owner = null;
		m_LifebarTimer = -1;
		
		//destroy any children we have left
		for(var i:int = 0;  i < transform.childCount; i++)
		{
			Destroy(transform.GetChild(i).gameObject);
		}
		
		//this object has essentially been reset
		if(Network.isServer)
		{
			ServerRPC.DeleteFromBuffer(m_Pedestal);
		}
		Destroy(gameObject);
	}
	else
	{
		m_LifebarTimer = 2;
	}	
}


