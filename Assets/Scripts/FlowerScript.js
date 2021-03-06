#pragma strict
private static var m_InstanceID : int = 0;

public var m_PollinationTimer : float = 0;
var m_PollinationTime : float = 5;

var m_Owner:GameObject = null; //which player controls this flower?
var m_Occupied:boolean = false; //Is there a bee currently on this flower?
var m_PointsPerSecond:float = 1; //how many points per second does this flower generate when it is controlled
@HideInInspector
var m_NumBees : int = 0;		 //how many bees are on this flower?
var m_MaxBees : int = 3;		 //what is the maximum number of bees that may be put on this flower?
var m_BaseHP : int = 10;		 //(the starting HP for the flower, m_MaxHP = m_MaxBees * m_BaseHP
var m_HP : int = 0;  			 //curr flower hp           

//GUI stuff
var m_LifeTexture:Texture2D = null;
var m_LifeBGTexture:Texture2D = null;
var m_DroneAssignmentTexture : Texture2D = null;
var m_AssignmentFlasherTexture : Texture2D = null;


//Effects
var m_DeathSound : AudioClip = null; 
var m_HurtSound : AudioClip = null; 
var m_DeathEffect : GameObject = null;
var m_ShieldEffect: GameObject = null;
var m_LifebarTimer : float = 1;
var m_ProgressEffectInstance : GameObject = null;


var m_BuildComplete : AudioClip;
var m_StopwatchDing: AudioClip;
function Awake()
{
	gameObject.name = "Flower"+ ++m_InstanceID;
}
function Start () {

m_PollinationTimer = 0;
m_PollinationTime = 0.5;

//m_ProgressEffect = gameObject.Instantiate(m_ProgressEffectInstance);
//m_ProgressEffect.active = false;

}

function Update () {

	if(m_Owner != null)
	{
		if(m_PollinationTimer < m_PollinationTime)
		{
			m_PollinationTimer += Time.deltaTime;
			
		}
		else
		{
			m_PollinationTimer = 0;
			m_Owner.GetComponent(BeeScript).m_Honey += 0.1;
		}
	}
	var clr:float = (Mathf.Sin(Time.time*3)+1)*0.25;
	GetComponent(MeshRenderer).materials[2].SetColor("_Emission", Color(clr,clr,clr));
	GetComponent(MeshRenderer).materials[0].SetColor("_Emission", Color(clr,clr,clr));

}



function OnGUI()
{
	if(m_LifebarTimer > 0 && m_Owner != null)
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
			var scrPos:Vector3 = cam.WorldToScreenPoint(transform.position+ Vector3.up * 24);
			
			if(Vector3.Dot((transform.position - player.transform.position), cam.transform.forward) > 0)
			{
				if((Screen.height - scrPos.y > camPos.y) && (Screen.height - scrPos.y < bottom) && scrPos.x > camPos.x && scrPos.x < camPos.x + cam.rect.width*Screen.width)
				{
					var height = 12;
					var width = 48;
					if(m_ShieldEffect != null)
					var percent:float = m_HP;
					percent /= (m_NumBees * m_BaseHP);
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
}





function OnCollisionEnter(coll : Collision)
{
	if(!Network.isServer)
		return;
	if (coll.gameObject.tag == "Explosion" && coll.gameObject.GetComponent(BombExplosionScript).m_Owner.GetComponent(BeeScript).m_Team != m_Owner.GetComponent(BeeScript).m_Team)
	{
		if(Network.isServer && m_HP > 0)
		{	
			m_HP -= m_BaseHP;
			ServerRPC.Buffer(GetComponent.<NetworkView>(), "SetHP",RPCMode.All, m_HP);
		}
	}
	else if (coll.gameObject.tag == "Hammer" && coll.gameObject.GetComponent(HammerScript).m_Owner != m_Owner)
	{
		Debug.Log("Smash");
		if(Network.isServer && m_HP > 0)
		{	
			m_HP -= m_BaseHP;
			ServerRPC.Buffer(GetComponent.<NetworkView>(), "SetHP",RPCMode.All, m_HP);
		}
	}
}

function OnTriggerEnter(other : Collider)
{
	if(other.gameObject.tag == "Player")
	{
		
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = gameObject;
		if(Network.isServer)
		{
			// //see if there is pollen to give
			// var go = gameObject.Find("/"+gameObject.name+"/Pollen");
			// if(go != null && GetComponentInChildren(BeeParticleScript).m_Owner == other.gameObject)
			// {
				// ServerRPC.Buffer(networkView,"GivePollen", RPCMode.All, other.gameObject.name);
			// }
		}
		
		if (other.gameObject.tag == "Explosion" && other.gameObject.GetComponent(BombExplosionScript).m_Owner.GetComponent(BeeScript).m_Team != m_Owner.GetComponent(BeeScript).m_Team)
		{
			if(Network.isServer && m_HP > 0)
			{	
				m_HP -= m_BaseHP;
				ServerRPC.Buffer(GetComponent.<NetworkView>(), "SetHP",RPCMode.All, m_HP);
			}
		}
		else
		if(m_Owner == other.gameObject)
		{
			GetComponent.<Collider>().isTrigger = true;
			if(m_ShieldEffect != null)
			{
			
				var color = NetworkUtils.GetColor(m_Owner);	
				color.a = 0.5;
				m_ShieldEffect.GetComponent.<Renderer>().material.SetColor("_TintColor", color);
				color*=0.5;
				color.a = 0.392*0.5;
				m_ShieldEffect.transform.Find("ShieldSphere").GetComponent.<Renderer>().material.SetColor("_TintColor", color);
			//	m_ShieldEffect.transform.Find("ShieldSphere").animation.Stop();
			//	m_ShieldEffect.transform.Find("ShieldSphere").animation.Play("FlowerShield");
				//transform.Find("LightSpot").renderer.enabled = false;
			}
		}
	}
	
}

function OnBulletCollision(coll:BulletCollision)
{
	if(Network.isServer)
	{	
		if(m_ShieldEffect != null)
		{
			
			//make sure we arent shooting our own bees
			var bs:BulletScript =coll.bullet.GetComponent(BulletScript);
			if(bs.m_Owner != m_Owner && bs.m_Owner.GetComponent(BeeScript).m_Team != m_Owner.GetComponent(BeeScript).m_Team)
			{
				//Handle power shot
				if(bs.m_PowerShot)
				{
					if(m_HP-5 <= 0)
						CoinScript.SpawnCoins(transform.position + Vector3.up *transform.localScale.magnitude, m_NumBees*3, coll.bullet.GetComponent(BulletScript).m_Owner);
					ServerRPC.Buffer(GetComponent.<NetworkView>(), "SetHP", RPCMode.All, m_HP-5);
				}
				//handle regular shot
				else
				{
					if(m_HP-bs.m_BaseDmg <= 0)
						CoinScript.SpawnCoins(transform.position + Vector3.up *transform.localScale.magnitude, m_NumBees*3, coll.bullet.GetComponent(BulletScript).m_Owner);
					ServerRPC.Buffer(GetComponent.<NetworkView>(), "SetHP", RPCMode.All, m_HP-bs.m_BaseDmg);					
				}
				
				
			}
			else
			{
				m_ShieldEffect.transform.Find("ShieldSphere").GetComponent.<Animation>().Stop();
				m_ShieldEffect.transform.Find("ShieldSphere").GetComponent.<Animation>().Play("FlowerShield");
			}
		}
	}
}

function OnTriggerStay(coll : Collider)
{
	var player:GameObject = null;
	//coll.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
	if(coll.gameObject.tag == "Explosion")
	{
		if(coll.gameObject.GetComponent(BombExplosionScript).m_Owner != null && m_Owner != null)
		{
			if(coll.gameObject.GetComponent(BombExplosionScript).m_Owner.GetComponent(BeeScript).m_Team != m_Owner.GetComponent(BeeScript).m_Team)
			{
				if(Network.isServer && m_HP > 0)
				{	
					m_HP -= m_BaseHP;
					ServerRPC.Buffer(GetComponent.<NetworkView>(), "SetHP",RPCMode.All, m_HP);
				}
			}
		}
	}
	else
	if(m_ShieldEffect != null)
	{
		var color = NetworkUtils.GetColor(m_Owner);	
		color.a = 0.5;
		m_ShieldEffect.GetComponent.<Renderer>().material.SetColor("_TintColor", color);
		color*=0.5;
		color.a = 0.392*0.5;
		m_ShieldEffect.transform.Find("ShieldSphere").GetComponent.<Renderer>().material.SetColor("_TintColor", color);
		GetComponent.<Collider>().isTrigger = true;
		//gameObject.Find(gameObject.name+"/LightSpot").renderer.enabled = true;
	}
	
	if(NetworkUtils.IsControlledGameObject(coll.gameObject))
	{	
		
		//handle player specific logic if the player is us
		if(coll.gameObject.GetComponent(ItemDecorator) == null && coll.gameObject.GetComponent(FlowerDecorator) == null 
		   && coll.gameObject.GetComponent(BeeScript).m_WorkerBees > 0)
		{
			
			var txt : GameObject  = gameObject.Find("GUITexture");	
			txt.transform.position = Camera.main.WorldToViewportPoint(coll.gameObject.transform.position);
			txt.transform.position.y += 0.03;
			if(!txt.GetComponent(GUITexture).enabled)
			{
				txt.GetComponent(GUITexture).enabled = true;
				txt.GetComponent.<Animation>().Play();
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

@RPC function  SetHP(hp:int)
{

	m_HP = hp;
	if(m_HP <= 0 && m_Owner)
	{
		//technically we should never be negative, but just in case
		m_HP = 0;
		GetComponent.<Collider>().isTrigger = true;
		AudioSource.PlayClipAtPoint(m_DeathSound, Camera.main.transform.position);
		
		var players:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
		for(var i:int = 0; i < players.length; i++)
		{
			var cam:GameObject = players[i].GetComponent(BeeScript).m_Camera;
			if(cam != null)
			{
				if((cam.transform.position - transform.position).magnitude < 500)
				{
					cam.GetComponent(CameraScript).Shake(0.25,3);
				}
			}
		}
	
		//spawn effects
		var deathEffect : GameObject = gameObject.Instantiate(m_DeathEffect);
		deathEffect.transform.position = transform.position + Vector3(0,12,0);
		deathEffect.GetComponent.<Renderer>().material.color = NetworkUtils.GetColor(m_Owner);
		
		deathEffect = gameObject.Instantiate(Resources.Load("GameObjects/ExplosionParticles"));
		deathEffect.transform.position = transform.position + Vector3(0,12,0);
		deathEffect.transform.GetChild(0).gameObject.GetComponent.<Renderer>().material.SetColor("_TintColor", NetworkUtils.GetColor(m_Owner));
		deathEffect.transform.GetChild(1).gameObject.GetComponent.<Renderer>().material.SetColor("_TintColor", NetworkUtils.GetColor(m_Owner));
		//deathEffect.renderer.material.color = m_Owner.renderer.material.color;
		
		//CLEAN UP
		//if(m_Owner != null)
		//	m_Owner.networkView.RPC("RemoveBeesFromSwarm", RPCMode.All, gameObject.name, GetComponentInChildren(ParticleEmitter).particleCount);
		
		m_Owner = null;
		m_NumBees = 0;
		m_LifebarTimer = -1;
		
		//destroy any children we have left
		for(i = 0;  i < transform.childCount; i++)
		{
			if(transform.GetChild(i).gameObject.GetComponent(WorkerBeeScript) != null)
				transform.GetChild(i).gameObject.GetComponent(WorkerBeeScript).Kill();
			else if(transform.GetChild(i).gameObject.layer != LayerMask.NameToLayer("Minimap"))
				Destroy(transform.GetChild(i).gameObject);
		}
		transform.Find("Flower_Minimap").GetComponent.<Renderer>().material.color = Color(1,1,1,0.5);
		Destroy(m_ShieldEffect);
		m_ShieldEffect = null;
		
		//this object has essentially been reset
		if(Network.isServer)
		{
			ServerRPC.DeleteFromBuffer(gameObject);
			// for(i = 0; i < 3; i++)
			// {
				// var Quat = Quaternion.AngleAxis(360.0/3 * i, Vector3.up);
				// var vel =  Quat*Vector3(0,0,1) ;//: Vector2 = Random.insideUnitCircle.normalized*50;
				// var viewID : NetworkViewID= Network.AllocateViewID();
				// var go1 : GameObject = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate("Coin","", transform.position + Vector3.up *transform.localScale.magnitude, Quaternion.identity, viewID ,  0);
				// go1.GetComponent(UpdateScript).m_Vel = vel.normalized * Random.Range(20, 50);
				// //go1.GetComponent(UpdateScript).m_Vel.z = vel.y;
				// go1.GetComponent(UpdateScript).m_Vel.y = Random.Range(20, 100);
				// ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, "Coin",go1.name, transform.position + Vector3.up *transform.localScale.magnitude, Quaternion.identity, viewID, 0);
				// go1.GetComponent(UpdateScript).MakeNetLive(); 	
			// }
		}
	}
	else
	{
		if(m_ShieldEffect != null)
		{
			m_LifebarTimer = 2;
			AudioSource.PlayClipAtPoint(m_HurtSound, Camera.main.transform.position);
			if(GetComponent(FlasherDecorator) == null)
			{
				gameObject.AddComponent(FlasherDecorator);
				GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
				GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
				
				var shieldSphere:GameObject = m_ShieldEffect.transform.Find("ShieldSphere").gameObject;
				shieldSphere.AddComponent(FlasherDecorator);
				shieldSphere.GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
				shieldSphere.GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
				shieldSphere.GetComponent.<Animation>().Stop();
				shieldSphere.GetComponent.<Animation>().Play("Shield");
			}
			//GetComponent(FlasherDecorato
		}
	}
	
}

function OnTriggerExit(other : Collider)
{
	if(other.gameObject.tag == "Player")
	{
				
		other.gameObject.GetComponent(BeeControllerScript).m_NearestObject = null;
		if(m_ShieldEffect != null)
		{
			GetComponent.<Collider>().isTrigger = false;
			m_ShieldEffect.transform.Find("ShieldSphere").GetComponent.<Animation>().Stop();
			m_ShieldEffect.transform.Find("ShieldSphere").GetComponent.<Animation>().Play("FlowerShield");
			var color = NetworkUtils.GetColor(m_Owner);	
			m_ShieldEffect.GetComponent.<Renderer>().material.SetColor("_TintColor", color);
			m_ShieldEffect.transform.Find("Shield_Minimap").GetComponent.<Renderer>().material.SetColor("_TintColor", color);
			color*=0.5;
			color.a = 0.392;
			
			m_ShieldEffect.transform.Find("ShieldSphere").GetComponent.<Renderer>().material.SetColor("_TintColor", color);
			//gameObject.Find(gameObject.name+"/LightSpot").renderer.enabled = true;
		}
		
		if(NetworkUtils.IsControlledGameObject(other.gameObject))
		{
			var txt : GameObject  = gameObject.Find("GUITexture");	
			txt.GetComponent(GUITexture).enabled = false;
		}
	}
	
}