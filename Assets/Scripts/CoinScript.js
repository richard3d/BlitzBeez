#pragma strict
var m_PickupSound : AudioClip = null;
var m_Owner :GameObject = null;
private static var m_InstanceID : int = 0;
var m_Timer:float = 0;
var m_Time:float = 1;

function Awake()
{
	gameObject.name = "Coin"+ ++m_InstanceID;
}

function Start () {

	GetComponent(UpdateScript).m_NetUpdateRotation = false;
	m_Timer = -0.5;

}

static function SpawnCoins(pos:Vector3, num:int, owner:GameObject)
{
	if(Network.isServer)
	{
		for(var i : int = 0; i < num; i++)
		{
			var Quat = Quaternion.AngleAxis(360.0/num * i, Vector3.up);
			var vel =  Quat*Vector3(0,0,1) ;//: Vector2 = Random.insideUnitCircle.normalized*50;
			var viewID : NetworkViewID= Network.AllocateViewID();
			var go1 : GameObject = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate("Coin","", pos, Quaternion.identity, viewID ,  0);
			go1.GetComponent(UpdateScript).m_Vel = vel.normalized * Random.Range(120, 50);
			go1.GetComponent(UpdateScript).m_Vel.y = Random.Range(20, 100);
			ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, "Coin",go1.name, pos, Quaternion.identity, viewID, 0);
			
			go1.GetComponent(CoinScript).m_Owner = owner;	
			go1.GetComponent(TrailRenderer).enabled = true;
		}

	}
}

function Update () {

	if(m_Owner != null)
	{
		gameObject.collider.enabled = false;
		//GetComponent(UpdateScript).m_Vel += (m_Owner.transform.position - transform.position).normalized * 10;
		
		if(m_Timer < m_Time)
		{
			m_Timer += Time.deltaTime;
			if(m_Timer > 0)
				transform.position += (m_Owner.transform.position - transform.position)*  (m_Timer/m_Time);
		}
		if((m_Timer >= m_Time || (m_Owner.transform.position - transform.position).magnitude < 4) && m_Time > 0)
		{
			m_Time = 0;
			OnTriggerEnter(m_Owner.collider);
		}
	}

	
}

function OnTriggerEnter(coll:Collider)
{
	if(coll.gameObject.tag == "Player")
	{
		if(Network.isServer)
			ServerRPC.Buffer(networkView, "GetCoin", RPCMode.All, coll.gameObject.name);
		animation.Stop();
		//Destroy(GetComponent(UpdateScript));
		//Destroy(GetComponent(ItemScript));
		transform.rotation = Quaternion.identity;
		transform.position = coll.gameObject.transform.position + Vector3 (0,6,0);
		transform.parent = coll.gameObject.transform.parent;
		
		GetComponent(SphereCollider).enabled = false;
		animation.Play("GetCoin");
		
	}

}

function OnCollisionEnter(coll : Collision)
{
	var other : Collider = coll.collider;
	if(other.gameObject.tag != "Player")
	{
		GetComponent(ItemScript).OnItemCollisionEnter(coll);
	}
}

@RPC
function GetCoin(name : String)
{
	var bee:GameObject = gameObject.Find(name);
	bee.GetComponent(BeeScript).m_Money+= 10;
	
	if(bee.GetComponent(LevelUpDecorator) != null)
	{
		return;
	}
	
	var currLevel:int = bee.GetComponent(BeeScript).m_CurrLevel;
	bee.GetComponent(BeeScript).m_CurrXP +=1;
	
	if(NetworkUtils.IsLocalGameObject(bee) && bee.GetComponent(BeeScript).m_XPMeterFlashTimer <= 0)
	{
		bee.GetComponent(BeeScript).FadeOutXPMeter(2);
		bee.GetComponent(BeeScript).m_XPMeterFlashTimer = 0.25;
	}
	
	if(bee.GetComponent(BeeScript).m_CurrXP >= bee.GetComponent(BeeScript).m_XPToLevel[currLevel])
	{
		//notify of level up
		
		bee.GetComponent(BeeScript).m_NumUpgradesAvailable++;
		bee.AddComponent(LevelUpDecorator);
		AudioSource.PlayClipAtPoint(bee.GetComponent(BeeScript).m_LevelUpSound, Camera.main.transform.position);
		GameEventMessenger.QueueMessage(NetworkUtils.GetClientObjectFromGameObject(bee).m_Name+ " leveled up");
		if(NetworkUtils.IsLocalGameObject(bee))
		{
			var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/EventText"));
			txt.GetComponent(GUIText).text = "Upgrade Unlocked!";
			txt.layer = LayerMask.NameToLayer("GUILayer_P"+(bee.GetComponent(NetworkInputScript).m_ClientOwner+1));
			
			var kudosText:GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
			kudosText.GetComponent(GUIText).material.color = Color.yellow;
			kudosText.GetComponent(KudosTextScript).m_WorldPos = transform.position;
			kudosText.GetComponent(UpdateScript).m_Lifetime = 2;
			kudosText.GetComponent(GUIText).text = "Level Up!";
			kudosText.animation.Stop();
			kudosText.animation.Play();
			kudosText.GetComponent(KudosTextScript).m_CameraOwner = bee.GetComponent(BeeScript).m_Camera;
			kudosText.layer = LayerMask.NameToLayer("GUILayer_P"+(bee.GetComponent(NetworkInputScript).m_ClientOwner+1));
		}
	}
	
	//we dashed into our first coin
	if(m_Owner == null && bee.GetComponent(BeeDashDecorator) != null && bee.GetComponent(CoinDashDecorator) == null)
	{
		bee.AddComponent(CoinDashDecorator);
	}
	else if(bee.GetComponent(CoinDashDecorator) != null)
	{
		bee.GetComponent(CoinDashDecorator).FindCoin(gameObject);
	}
	
	if(bee.GetComponent(FlasherDecorator) == null)
	{
		bee.AddComponent(FlasherDecorator);
		bee.GetComponent(FlasherDecorator).m_Color = Color.white;
		bee.GetComponent(FlasherDecorator).m_FlashDuration = 0.08;
		bee.GetComponent(FlasherDecorator).m_NumberOfFlashes = 7;
	}
	var effect : GameObject = gameObject.Instantiate(GetComponent(ItemScript).m_PickupEffect);
	effect.transform.position = bee.transform.position;
	AudioSource.PlayClipAtPoint(m_PickupSound, Camera.main.transform.position);
	
	if(NetworkUtils.IsLocalGameObject(bee) && bee.GetComponent(CoinDashDecorator) == null)
	{
		
		if(gameObject.Find("XPKudos") != null)
		{
			kudosText = gameObject.Find("XPKudos");
		}
		else
		{
			kudosText = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
		}
		 kudosText.name = "XPKudos";
		 kudosText.animation.Stop();
		 kudosText.animation["KudosText"].time = 0;
		 kudosText.animation.Play("KudosText");
		 kudosText.GetComponent(GUIText).material.color = Color.yellow;
		 kudosText.GetComponent(KudosTextScript).m_WorldPos = transform.position;
		 kudosText.GetComponent(UpdateScript).m_Lifetime = 2;
		 kudosText.GetComponent(GUIText).text = "+1 XP";
		 kudosText.GetComponent(GUIText).fontSize = 32;
		 kudosText.GetComponent(KudosTextScript).m_CameraOwner = bee.GetComponent(BeeScript).m_Camera;
		 kudosText.layer = LayerMask.NameToLayer("GUILayer_P"+(bee.GetComponent(NetworkInputScript).m_ClientOwner+1));
	}
}

function KillCoin()
{
	if(Network.isServer)
	{
		var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript);
		ServerRPC.Buffer(server.m_SyncMsgsView, "NetworkDestroy", RPCMode.All, gameObject.name);
		ServerRPC.DeleteFromBuffer(gameObject);	
	}	
}

function OnDestroy()
{
	
}