#pragma strict
var m_ItemToGive : GameObject = null;
var m_PickupEffect : GameObject = null;
var m_PickupSound : AudioClip = null;
var m_CollisionSound : AudioClip = null;
var m_Lifetime : float = 10;
private var m_BlinkTimer : float = 0;


function Start () {

	if(transform.parent != null && transform.parent.gameObject.tag == "Trees")
	{	
		renderer.enabled = false;
	}
	GetComponent(UpdateScript).m_Accel.y = -289.8;
}

function Update () {
    
	rigidbody.velocity = Vector3(0,0,0);
	var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	if(Comp == null)
		return;
	
	//Comp.m_Accel.y = -289.8;
	
	if(Network.isServer)
	{	
		var Terr:TerrainCollisionScript = GetComponent(TerrainCollisionScript);
		if(Terr != null)
		{
			if(Terr.m_OverTerrain)
			{
				
				if(gameObject.tag == "Coins")
				{
					if(transform.position.y  + Comp.m_Vel.y * Time.deltaTime < Terr.m_TerrainInfo.point.y)
					{
						transform.position.y = Terr.m_TerrainInfo.point.y+0.2;
						Comp.m_Vel.y *= -0.75;
						if(Mathf.Abs(Comp.m_Vel.y) > 25)
							networkView.RPC("ItemCollision", RPCMode.All);
						//Debug.Log(Comp.m_Vel.y+ " "+Comp.m_Accel.magnitude*Time.deltaTime);
						if(Mathf.Abs(Comp.m_Vel.y) > 10)
						{
							//Debug.Log("Setting zero");
							//Comp.m_Vel = Vector3(0,0,0);
							//Comp.m_Accel = Vector3(0,0,0);
						}
					}	
				}
					
				else
				{
					var size:float = transform.localScale.z * GetComponent(SphereCollider).radius;
					if(transform.position.y - size + Comp.m_Vel.y * Time.deltaTime < Terr.m_TerrainInfo.point.y)
					{
						transform.position.y = size+Terr.m_TerrainInfo.point.y;
						Comp.m_Vel.y *= -0.75;
						if(Mathf.Abs(Comp.m_Vel.y) > 25)
							networkView.RPC("ItemCollision", RPCMode.All);
						if(Comp.m_Vel.magnitude < 0.1)
						{
							//Debug.Log("Setting zero");
							Comp.m_Vel = Vector3(0,0,0);
							Comp.m_Accel = Vector3(0,0,0);
						}
					}	
				}
			}
			
			
		}	
	}
	
	
	//handle fade out and death
	m_Lifetime -= Time.deltaTime;
	m_BlinkTimer -= Time.deltaTime;
	
	if(m_Lifetime <= 0)
	{
		if(Network.isServer)
		{
			var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript);
			ServerRPC.Buffer(server.m_SyncMsgsView, "NetworkDestroy", RPCMode.All, gameObject.name);
			ServerRPC.DeleteFromBuffer(gameObject);
			
		}
	}
	else
	if(m_Lifetime < 3)
	{
		if(m_BlinkTimer	< 0)
		{
			m_BlinkTimer = 0.1;
			renderer.enabled = !renderer.enabled;
			//GetComponentInChildren(Renderer).enabled = !GetComponentInChildren(Renderer).enabled;
			for(var t :Transform in transform)
			{
				t.GetComponent(Projector).enabled = !t.GetComponent(Projector).enabled;
			}
		}
	}
}



function OnTriggerEnter(coll:Collider)
{
	if(coll.gameObject.tag == "Player")
	{
		if(Network.isServer && gameObject.tag != "Coins")
		{
			ServerRPC.Buffer(networkView, "AddItemToPlayerInvetory", RPCMode.All, coll.gameObject.name);
			ServerRPC.DeleteFromBuffer(gameObject);
		}
	}
}

function OnItemCollisionEnter(coll : Collision)
{
	var other : Collider = coll.collider;
	
	if(other.gameObject.tag != "Player")
	{
		if(GetComponent(UpdateScript).m_Vel .y < 0 && other.gameObject.tag != "Terrain")
		{
		    for (var contact : ContactPoint in coll.contacts) 
			  {
				if(gameObject.tag == "Coins")
					transform.position = contact.point;
				else
					transform.position = contact.point+ contact.normal * transform.localScale.z * GetComponent(SphereCollider).radius;
				 GetComponent(UpdateScript).m_Vel = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, contact.normal) * 0.75;
				 GetComponent(UpdateScript).m_Accel.y = -289.8;
				 return;
			  }
		}
	}
}

function OnCollisionStay(coll : Collision)
{
	var other : Collider = coll.collider;
	if(other.gameObject.layer == "Terrain")
	{
		GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
		GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	}
}
@RPC function ItemCollision()
{
	AudioSource.PlayClipAtPoint(m_CollisionSound, Camera.main.transform.position);
	if(gameObject.tag == "Coins")
	{
		gameObject.AddComponent(FlasherDecorator);
		GetComponent(FlasherDecorator).m_Color = Color.gray;
		GetComponent(FlasherDecorator).m_FlashDuration = 0.25;
		GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
	}
}

@RPC function AddItemToPlayerInvetory(name : String)
{
	var effect : GameObject = gameObject.Instantiate(m_PickupEffect);
	var go : GameObject = gameObject.Find(name);
	effect.transform.position = go.transform.position;
	AudioSource.PlayClipAtPoint(m_PickupSound, Camera.main.transform.position);
	
	if(NetworkUtils.IsLocalGameObject(go))
	{
		var kudosText:GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
		kudosText.GetComponent(GUIText).material.color = Color.yellow;
		kudosText.GetComponent(KudosTextScript).m_WorldPos = transform.position;
		kudosText.GetComponent(UpdateScript).m_Lifetime = 2;
		kudosText.GetComponent(GUIText).fontSize = 32;
		kudosText.GetComponent(GUIText).text = "Got "+m_ItemToGive.name+"!";
		kudosText.GetComponent(KudosTextScript).m_CameraOwner = go.GetComponent(BeeScript).m_Camera;
		kudosText.layer = LayerMask.NameToLayer("GUILayer_P"+(go.GetComponent(NetworkInputScript).m_ClientOwner+1));
	}
	if(m_ItemToGive != null)
	{
		if(go.GetComponent(BeeScript).m_Inventory[0].m_Item == null)
		{	
			go.GetComponent(BeeScript).m_Inventory[0].m_Item = m_ItemToGive;
			go.GetComponent(BeeScript).m_Inventory[0].m_Img = renderer.material.mainTexture;
		}
		else
		if(go.GetComponent(BeeScript).m_Inventory[1].m_Item == null)
		{	
			go.GetComponent(BeeScript).m_Inventory[1].m_Item = m_ItemToGive;
			go.GetComponent(BeeScript).m_Inventory[1].m_Img = renderer.material.mainTexture;
		}
	}
	Destroy(gameObject);
} 

function OnDestroy()
{
	//Debug.Log("Destroying "+ gameObject.name);
}

