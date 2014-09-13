#pragma strict
var m_ItemToGive : GameObject = null;
var m_PickupEffect : GameObject = null;
var m_PickupSound : AudioClip = null;

var m_Lifetime : float = 10;
private var m_BlinkTimer : float = 0;

function Start () {

	if(transform.parent != null && transform.parent.gameObject.tag == "Trees")
	{	
		renderer.enabled = false;
	}
	
}

function Update () {
    
	rigidbody.velocity = Vector3(0,0,0);
	var Comp : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	if(Comp == null)
		return;
	
	Comp.m_Accel.y = -289.8;
	
	
	//handle fade out and death
	m_Lifetime -= Time.deltaTime;
	m_BlinkTimer -= Time.deltaTime;
	
	if(m_Lifetime <= 0)
	{
		if(Network.isServer)
		{
			var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript);
			ServerRPC.Buffer(server.m_SyncMsgsView, "NetworkDestroy", RPCMode.All, gameObject.name);
			//ServerRPC.DeleteFromBuffer(gameObject);
			
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

function OnDestroy()
{
	Debug.Log("Destroying "+ gameObject.name);
}

function OnItemCollisionEnter(coll : Collision)
{
	var other : Collider = coll.collider;
	
	if(other.gameObject.tag == "Player")
	{
		if(Network.isServer)
		{
			//ServerRPC.DeleteFromBuffer(gameObject);
			ServerRPC.Buffer(networkView, "AddItemToPlayerInvetory", RPCMode.All, other.gameObject.name);
			ServerRPC.DeleteFromBuffer(gameObject);
			var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript);
			//ServerRPC.Buffer(server.m_SyncMsgsView, "NetworkDestroy", RPCMode.All, gameObject.name);
		}
	}
	else
	{
		if(GetComponent(UpdateScript).m_Vel .y < 0)
		{
			for (var contact : ContactPoint in coll.contacts) 
			  {
				Debug.Log(contact.normal+" "+ GetComponent(UpdateScript).m_Vel+" "+Vector3.Reflect(GetComponent(UpdateScript).m_Vel, contact.normal));
				 GetComponent(UpdateScript).m_Vel = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, contact.normal) * 0.75;
				 return;
			  }
		}
	}
}

function OnCollisionStay(coll : Collision)
{
	var other : Collider = coll.collider;
	if(other.gameObject.name == "Plane")
	{
		GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
		GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	}
}


@RPC function AddItemToPlayerInvetory(name : String)
{
	var effect : GameObject = gameObject.Instantiate(m_PickupEffect);
	var go : GameObject = gameObject.Find(name);
	effect.transform.position = go.transform.position;
	AudioSource.PlayClipAtPoint(m_PickupSound, Camera.main.transform.position);
	
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

