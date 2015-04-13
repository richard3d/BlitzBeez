#pragma strict

private var m_MovementKeyPressed : boolean = false;
private var m_MovementSpeed : float = 50;
private var m_Forward:Vector3;
private var m_Right:Vector3;
private var m_OrigCamOffset:Vector3;
private var m_Camera:GameObject = null;
var m_MovementEnabled : boolean = true;
var m_Hammer:GameObject;
function Start () {
	
	GetComponent(BeeControllerScript).m_ControlEnabled = false;
	GetComponent(BeeControllerScript).m_LookEnabled = false;
	m_MovementSpeed = GetComponent(UpdateScript).m_MaxSpeed = 75;
	GameObject.Find(gameObject.name+"/Bee").transform.localEulerAngles.z = 0;
	var zDot = Vector3.Dot(transform.forward, Vector3.forward);
	var xDot = Vector3.Dot(transform.forward, Vector3.right);
	
	//find out which direction we are pointing most towards
	m_Forward = Vector3(1,0,0);
	if(Mathf.Abs(zDot) > Mathf.Abs(xDot))
	{
		//forward
		m_Forward = (zDot * Vector3.forward).normalized;
	}
	else
	{
		//right
		m_Forward = (xDot * Vector3.right).normalized;
	}
	m_Right = Vector3.Cross(Vector3.up,m_Forward);
	transform.LookAt(transform.position + m_Forward);		
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_Camera =GetComponent(BeeScript).m_Camera;
		m_Camera.GetComponent(CameraScript).m_Fixed = true;
		m_Camera.GetComponent(CameraScript).m_Offset = -Vector3.forward *200 + Vector3.up *200;
		m_Camera.GetComponent(CameraScript).m_Pitch = 45;
		m_Camera.GetComponent(CameraScript).SnapToOffset();
		m_OrigCamOffset = m_Camera.GetComponent(CameraScript).m_DefaultOffset;
	}	
	
	
}

function Update()
{
	GetComponent(BeeControllerScript).m_ControlEnabled = false;
	GetComponent(BeeControllerScript).m_LookEnabled = false;
}



function OnNetworkInput(IN : InputState)
{
	if(!networkView.isMine)
	{
		return;
	}
	
	var Updater : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
		//Updater.m_Accel = Vector3(0,0,0);
	if(!m_MovementKeyPressed)
	{
		
		
		var currSpeed : float = Updater.m_Vel.magnitude;
		if(currSpeed - 5* Time.deltaTime <= 0)
		{
			Updater.m_Vel = Vector3(0,Updater.m_Vel.y,0);
		}
		else
		{
			Updater.m_Vel -= GetComponent(UpdateScript).m_Vel.normalized * 5 * Time.deltaTime;
		}
	}
	
	if(!m_MovementEnabled)
	{
		Updater.m_Vel = Vector3(0,0,0);
		return;	
	}		
	m_MovementKeyPressed = false;
	var IsDashing : boolean = GetComponent(BeeDashDecorator) == null ? false : true;
	
	//handle essential strafe movements
	//we arent allowed to change direction if we hit the dash button though
	var yVel:float = Updater.m_Vel.y;
	
	if(IN.GetAction(IN.MOVE_UP))
	{
		Updater.m_Vel = m_Forward *m_MovementSpeed+Vector3(0,Updater.m_Vel.y,0);
		m_MovementKeyPressed = true;
	}
	else
	if(IN.GetAction(IN.MOVE_RIGHT))
	{
		Updater.m_Vel = m_Right*m_MovementSpeed+Vector3(0,Updater.m_Vel.y,0);
		m_MovementKeyPressed = true;
	}
	else
	if(IN.GetAction(IN.MOVE_BACK))
	{
		Updater.m_Vel = -m_Forward*m_MovementSpeed+Vector3(0,Updater.m_Vel.y,0);
		m_MovementKeyPressed = true;
	}
	else	
	if(IN.GetAction(IN.MOVE_LEFT))
	{
		Updater.m_Vel = -m_Right*m_MovementSpeed+Vector3(0,Updater.m_Vel.y,0);
		m_MovementKeyPressed = true;
	}
	Updater.m_Vel.y = yVel;
	
	if(Updater.m_Vel.magnitude != 0)
		transform.LookAt(transform.position + Vector3(Updater.m_Vel.x, 0,Updater.m_Vel.z));

}

function OnDestroy()
{
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_Camera.GetComponent(CameraScript).m_Fixed = false;
		m_Camera.GetComponent(CameraScript).m_Offset = m_OrigCamOffset;
		m_Camera.GetComponent(CameraScript).m_Pitch = m_Camera.GetComponent(CameraScript).m_DefaultPitch;
		
	}	
	
	GetComponent(BeeControllerScript).m_ControlEnabled = true;
	GetComponent(BeeControllerScript).m_LookEnabled = true;
	Destroy(m_Hammer);
	
}
