#pragma strict


var m_MaxSpeed : float = 1;
var m_MaxAccel : float = 1;
var m_PrevPos:Vector3;
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
private var m_UpdateCount:int = 0;
private var m_UpdateMsgCount:int = 0;
private var m_UpdateMsgs:UpdatePacket[] = null;

class UpdatePacket
{
	var seq:int = 0;
	var deltaTime:float = 0;
	var pos:Vector3;
	var ang:Quaternion;
	var vel:Vector3;
	var accel:Vector3;
}

function Start () {

	m_DefaultMaxSpeed = m_MaxSpeed;
}

function Update () {
	
	var delta:float = Time.deltaTime;
	if(m_Lifetime >= 0)
	{
		m_Lifetime -= delta;
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
	m_Vel += m_Accel * delta;
	
	//handle special case for drag
	if(m_Drag > 0)
	{
		if(m_DragAffectsVelY)
		{
			if(m_Vel.magnitude - m_Drag * delta <= 0)
				m_Vel = Vector3(0,0,0);
			else
				m_Vel -= m_Vel.normalized * m_Drag* delta;
		}
		else
		{
			var velTemp : Vector3 = m_Vel;
			velTemp.y = 0;
			if(velTemp.magnitude - m_Drag * delta <= 0)
				m_Vel.x = m_Vel.z = 0;
			else
				m_Vel -= velTemp.normalized * m_Drag*delta;
		}
	}
	
	
	if(Vector3(m_Vel.x,0,m_Vel.z).magnitude > m_MaxSpeed)
	{
		var vertSpeed = m_Vel.y;
		m_Vel.Normalize();
		m_Vel *= m_MaxSpeed;
		m_Vel.y = vertSpeed;
	}

	m_PrevPos = transform.position;
	
	
	if(GetComponent(CharacterController) != null && GetComponent(CharacterController).enabled)
	{
		GetComponent(CharacterController).Move(m_Vel*delta);
	}
	else
		transform.position += m_Vel * delta;
	

	// if(NetworkUtils.IsControlledGameObject(gameObject))
	// {		
		// m_UpdateCount++;
		// var update:UpdatePacket = new UpdatePacket();
		// update.pos = transform.position;
		// update.ang = transform.rotation;
		// update.vel = m_Vel;
		// update.accel = m_Accel;
		// update.deltaTime = delta;
		// update.seq = m_UpdateCount;
		
		// if(m_UpdateMsgs == null)
		// {
			// m_UpdateMsgs = new UpdatePacket[1];
			// m_UpdateMsgs[0] = update;
		// }
		// else
		// {
			// var arr:Array = new Array(m_UpdateMsgs);
			// arr.Push(update);
			// m_UpdateMsgs = arr.ToBuiltin(UpdatePacket);
		// }
	// }
}

function RecalcUpdate (pos:Vector3, ang:Quaternion, vel:Vector3, accel:Vector3, delta:float) {
	
	

	vel += accel * delta;
	
	//handle special case for drag
	if(m_Drag > 0)
	{
		if(m_DragAffectsVelY)
		{
			if(vel.magnitude - m_Drag * delta <= 0)
				vel = Vector3(0,0,0);
			else
				vel -= vel.normalized * m_Drag* delta;
		}
		else
		{
			var velTemp : Vector3 = vel;
			velTemp.y = 0;
			if(velTemp.magnitude - m_Drag * delta <= 0)
				vel.x = vel.z = 0;
			else
				vel -= velTemp.normalized * m_Drag*delta;
		}
	}
	
	
	if(Vector3(vel.x,0,vel.z).magnitude > m_MaxSpeed)
	{
		var vertSpeed = vel.y;
		vel.Normalize();
		vel *= m_MaxSpeed;
		vel.y = vertSpeed;
	}

		
	if(GetComponent(CharacterController) != null && GetComponent(CharacterController).enabled)
	{
		GetComponent(CharacterController).Move(vel*delta);
		//if(NetworkUtils.IsControlledGameObject(gameObject))
		//	Debug.Log("Where I lerp to: "+transform.position);
	}
	else
		transform.position += vel * delta;
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
	//	stream.Serialize(m_UpdateMsgCount);
		
		
    } 
	else 
	{
		stream.Serialize(vPos);
		//if(NetworkUtils.IsControlledGameObject(gameObject))
			//Debug.Log("Where I think I am: "+transform.position);
		//Debug.Log(gameObject.name + " Serializing");
		
		//	if(NetworkUtils.IsControlledGameObject(gameObject))
			//	Debug.Log("Where I really am: "+transform.position);
		if(m_NetUpdateRotation)
		{
			stream.Serialize(vAng);
			transform.rotation = Quaternion.Slerp(transform.rotation, vAng, Time.deltaTime * 60);
		}
		stream.Serialize(m_Accel);
		stream.Serialize(m_Vel);
		stream.Serialize(m_MaxSpeed);
		
		// if(NetworkUtils.IsControlledGameObject(gameObject))
		// {
			// var seq:int = m_UpdateMsgCount++;
			// //Debug.Log("Streamin "+m_UpdateMsgCount);
		
			// var arr:Array = new Array(m_UpdateMsgs);
			// while(arr.length >= 1)
			// {
				// var msg:UpdatePacket = arr[0] as UpdatePacket;
				// if(msg.seq <= m_UpdateMsgCount)
				// {
					// Debug.Log(" Shifting "+msg.seq+" "+m_UpdateMsgCount);
					// arr.Shift();
				// }
				// else
					// break;
			// }
			// m_UpdateMsgs = arr.ToBuiltin(UpdatePacket);
			
			// for(var i = 0; i < m_UpdateMsgs.length; i++)
			// {
				// //Debug.Log(m_UpdateMsgCount +" "+m_UpdateMsgCount);
				// msg = m_UpdateMsgs[i] as UpdatePacket;
				// RecalcUpdate(msg.pos,msg.ang, msg.vel, msg.accel, msg.deltaTime);
			// }
			// Debug.Log("Update Length "+m_UpdateMsgs.length);
			
		
		// }
		transform.position = vPos;
		
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