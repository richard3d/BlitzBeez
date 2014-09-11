#pragma strict


var m_MaxSpeed : float = 1;
var m_MaxAccel : float = 1;
var m_Vel : Vector3;
var m_Accel : Vector3;
var m_Drag : float = 0;
var m_DragAffectsVelY : boolean = false;
var m_DefaultMaxSpeed : float = 0;
var m_NetUpdateRotation : boolean = true;

var m_Lifetime : float = -1;

//this variable is used so that when a parent is added or removed we 
//can let the network know once by comparing the prev parent
private var m_PrevParent : Transform = null;


function Start () {

	m_DefaultMaxSpeed = m_MaxSpeed;
}

function Update () {
	
	if(m_Lifetime >= 0)
	{
		m_Lifetime -= Time.deltaTime;
		if(m_Lifetime < 0)
		{
			Destroy(gameObject);
		}
	}
	
	//handle parent issues for network
	if(GetComponent(NetworkView) && m_PrevParent != transform.parent)
	{
		if(Network.isServer)
		{
			var name : String = transform.parent == null ? "" : transform.parent.name;
			networkView.RPC("LinkToParent", RPCMode.Others,  name);
		}
	}
	m_PrevParent = transform.parent;

	if(m_Accel.magnitude > m_MaxAccel)
	{
		m_Accel.Normalize();
		m_Accel *= m_MaxAccel;
	}
	m_Vel += m_Accel * Time.deltaTime;
	
	//handle special case for drag
	if(m_Drag > 0)
	{
		if(m_DragAffectsVelY)
		{
			if(m_Vel.magnitude - m_Drag * Time.deltaTime <= 0)
				m_Vel = Vector3(0,0,0);
			else
				m_Vel -= m_Vel.normalized * m_Drag* Time.deltaTime;
		}
		else
		{
			var velTemp : Vector3 = m_Vel;
			velTemp.y = 0;
			if(velTemp.magnitude - m_Drag * Time.deltaTime <= 0)
				m_Vel.x = m_Vel.z = 0;
			else
				m_Vel -= velTemp.normalized * m_Drag* Time.deltaTime;
		}
	}
	
	
	if(m_Vel.magnitude > m_MaxSpeed)
	{
		m_Vel.Normalize();
		m_Vel *= m_MaxSpeed;
	}
	
	 if(Physics.Raycast (transform.position, m_Vel, m_Vel.magnitude*Time.deltaTime))
	 {
		// return;
	 }
	
	transform.position += m_Vel * Time.deltaTime;
}

function OnSerializeNetworkView(stream : BitStream, info : NetworkMessageInfo) 
{
	var vPos : Vector3;
	var vAng : Quaternion;	
   
	if (stream.isWriting) 
	{
		vPos = transform.position;
		vAng = transform.rotation;
		stream.Serialize(vPos);
		if(m_NetUpdateRotation)
			stream.Serialize(vAng);
	    stream.Serialize(m_Accel);
        stream.Serialize(m_Vel);
		stream.Serialize(m_MaxSpeed);
		
		
    } 
	else 
	{
		stream.Serialize(vPos);
		if(gameObject.tag == "Rocks")
			Debug.Log(gameObject.name + " Serializing");
		transform.position = Vector3.Lerp(transform.position,vPos, 0.5f);
		if(m_NetUpdateRotation)
		{
			stream.Serialize(vAng);
			transform.rotation = Quaternion.Slerp(transform.rotation, vAng, Time.deltaTime * 60);
		}
		stream.Serialize(m_Accel);
		stream.Serialize(m_Vel);
		stream.Serialize(m_MaxSpeed);
    }    
}

@RPC function LinkToParent(parent : String)
{
	if(parent == "")
			transform.parent = null;
	else
		transform.parent = gameObject.Find(parent).transform;
}

function MakeNetLive()
{
	if(Network.isServer)
	{
		var viewID : NetworkViewID = Network.AllocateViewID();
		ServerRPC.Buffer(networkView, "NetworkActivate", RPCMode.All, viewID);
	}
}

function MakeNetLive(pos : Vector3, rot : Quaternion, vel : Vector3)
{
	if(Network.isServer)
	{
		var viewID : NetworkViewID = Network.AllocateViewID();
		ServerRPC.Buffer(networkView, "NetworkActivate2", RPCMode.All, viewID, pos, rot, vel);
	}
}

@RPC function NetworkActivate(viewID : NetworkViewID)
{
	Debug.Log("Networking Activating: " + gameObject.name);
	//var go : GameObject = gameObject.Find(name);
	//if(go.GetComponent(NetworkView) == null)
	//{
	
	gameObject.AddComponent(typeof(NetworkView));
	var view : NetworkView = GetComponents(NetworkView)[1];
	view.viewID = viewID;
		//go.networkView.viewID = viewID;
	
	view.observed = this;
	view.stateSynchronization = NetworkStateSynchronization.ReliableDeltaCompressed;
	//ServerRPC.Buffer(m_GameplayMsgsView, "MakeGameObjectLive", RPCMode.Others, go.name, viewID);
}

@RPC function NetworkActivate2(viewID : NetworkViewID, pos : Vector3, rot : Quaternion, vel : Vector3)
{
	Debug.Log("Networking Activating: " + gameObject.name);
	if(!Network.isServer)
	{
		transform.position = pos;
		transform.rotation = rot;
		GetComponent(UpdateScript).m_Vel = vel;
	}
	gameObject.AddComponent(typeof(NetworkView));
	var view : NetworkView = GetComponents(NetworkView)[1];
	view.viewID = viewID;
		//go.networkView.viewID = viewID;
	
	view.observed = this;
	view.stateSynchronization = NetworkStateSynchronization.ReliableDeltaCompressed;
}

@RPC function NetworkDeactivate()
{

	if(GetComponents(NetworkView).length > 1)
		DestroyImmediate(GetComponents(NetworkView)[1]);
}