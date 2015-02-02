#pragma strict
var m_Owner :GameObject = null;
var m_MineExplosion : GameObject = null;

var m_ExplosionSound : AudioClip = null;
var m_StickSound : AudioClip = null;
var m_ActivateSound : AudioClip = null;
var m_Armed:boolean = false;
var m_HideTimer:float = -1;	//how long the mine takes to hide after contact with ground 
var m_TriggerTimer:float = -1; //how long from when the mine is visible to when it explodes

function Start () {

}

function Update () {
	
	
	if(m_Armed)
	{
		if(m_HideTimer > 0)
		{
			m_HideTimer -= Time.deltaTime;
			if(m_HideTimer <= 0)
			{
				renderer.enabled = false;
				for(var t:Transform in transform)
				{
					t.renderer.enabled = false;
				}
				
			}
		}
	
		if(m_TriggerTimer > 0)
		{
			m_TriggerTimer -= Time.deltaTime;
			if(m_TriggerTimer <= 0)
			{
				Explode();
			}
		}
	}
	else
	{
		if(Network.isServer)
		{
			var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
			var Terr:TerrainCollisionScript = GetComponent(TerrainCollisionScript);
			if(Terr.m_OverTerrain)
			{
				if(transform.position.y - transform.localScale.y + Comp.m_Vel.y * Time.deltaTime < Terr.m_TerrainInfo.point.y)
				{
					transform.position.y = Terr.m_TerrainInfo.point.y+transform.localScale.y;
					Comp.m_Vel = Vector3(0,0,0);
					Comp.m_Accel = Vector3(0,0,0);
					ServerRPC.Buffer(networkView,"ArmMine", RPCMode.All); 
					
				}	
			}
		}
	}
}

function OnTriggerEnter(coll : Collider)
{
	if(Network.isServer)
	{
		Debug.Log(coll.gameObject.tag);
		if(/*m_Owner != coll.gameObject &&*/(coll.gameObject.tag == "Player" || coll.gameObject.tag == "Bears") && m_Armed)
		{
			ServerRPC.Buffer(networkView,"TriggerMine", RPCMode.All); 
			
		}
	}
}

@RPC function TriggerMine()
{
	m_TriggerTimer = 0.5;
	renderer.enabled = true;
	for(var t:Transform in transform)
	{
		t.renderer.enabled = true;
	}
}

@RPC function ArmMine()
{
	m_Armed = true;
	//var rds:Renderer[] = GetComponentsInChildren(Renderer);
	for(var t:Transform in transform)
	{
		t.renderer.material.color = Color.red;
	}
	m_HideTimer=1;
}

@RPC function ActivateItem(owner : String)
{

	var go : GameObject = gameObject.Find(owner);
	if(go != null)
	{
		m_Owner = go;
		go.AddComponent(ItemDecorator);
		go.GetComponent(ItemDecorator).SetItem(gameObject, Vector3(0,0,10), Vector3(0,0,0), false, false);
		go.GetComponent(ItemDecorator).m_MaxSpeed = 50;
		AudioSource.PlayClipAtPoint(m_ActivateSound, Camera.main.transform.position);
		
	}
}

function Explode()
{
	if(Network.isServer)
	{
		
		ServerRPC.Buffer(networkView, "KillMine", RPCMode.All);
		ServerRPC.DeleteFromBuffer(gameObject);
	}
}

@RPC function KillMine()
{
	AudioSource.PlayClipAtPoint(m_ExplosionSound, Camera.main.transform.position);
	//GetComponent(SphereCollider).enabled = false;
	
	//if(m_Owner != null && m_Owner.GetComponent(ItemDecorator) != null)
	//	m_Owner.Destroy(m_Owner.GetComponent(ItemDecorator));
	// if(m_Owner != null)
	// {
		// if(m_Owner.GetComponent(ItemDecorator))
			// m_Owner.GetComponent(ItemDecorator).ThrowItem();
	// }
	
	
	for (var child : Transform in transform)
	{
		child.gameObject.active = false;
	}
	renderer.enabled = false;
	
	
	var go : GameObject = gameObject.Instantiate(m_MineExplosion);
	go.transform.position = transform.position;
	Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
	
	transform.eulerAngles = Vector3(0,0,0);
	var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	Comp.m_Vel = Vector3(0,0,0);
	Comp.m_Accel = Vector3(0,0,0);
	m_Owner = null;
	
	Destroy(gameObject);
}
