#pragma strict

private var m_MovementKeyPressed : boolean = false;
private var m_MovementSpeed : float = 240;

var m_MovementEnabled : boolean = true;

function Start () {
	
	var zDot = Vector3.Dot(transform.forward, Vector3.forward);
	var xDot = Vector3.Dot(transform.forward, Vector3.right);
	
	//find out which direction we are pointing most towards
	var dir = Vector3(1,0,0);
	if(Mathf.Abs(zDot) > Mathf.Abs(xDot))
	{
		//forward
		dir = (zDot * Vector3.forward).normalized;
	}
	else
	{
		//right
		dir = (xDot * Vector3.right).normalized;
	}
	transform.LookAt(transform.position + dir);		
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		 Camera.main.GetComponent(CameraScript).m_Fixed = true;
		// Camera.main.GetComponent(CameraScript).m_CamVel = Vector3(0,0,0);
		// Camera.main.GetComponent(CameraScript).m_CamPos = Vector3(transform.position.x, Camera.main.transform.position.y, transform.position.z) - dir *200;
		// Camera.main.GetComponent(CameraScript).m_Offset = dir *200 - Vector3.up *200;
		// Camera.main.transform.eulerAngles.z = 0;
		// Camera.main.transform.eulerAngles.y = transform.eulerAngles.y;
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
		Updater.m_Accel = Vector3(0,0,0);
	if(!m_MovementKeyPressed)
	{
		
		
		var currSpeed : float = Updater.m_Vel.magnitude;
		if(currSpeed - 5* Time.deltaTime <= 0)
		{
			Updater.m_Vel = Vector3(0,0,0);
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
	var vRight:Vector3  = transform.right;
	vRight.y = 0;
	vRight.Normalize();
	var vFwd:Vector3 = transform.forward;
	vFwd.y = 0;
	vFwd.Normalize();
	
	if(IN.GetAction(IN.MOVE_UP))
	{
		Updater.m_Vel = vFwd *m_MovementSpeed;
		m_MovementKeyPressed = true;
	}
	else
	if(IN.GetAction(IN.MOVE_RIGHT))
	{
		Updater.m_Vel = vRight*m_MovementSpeed;
		m_MovementKeyPressed = true;
	}
	else
	if(IN.GetAction(IN.MOVE_BACK))
	{
		Updater.m_Vel = -vFwd*m_MovementSpeed;
		m_MovementKeyPressed = true;
	}
	else	
	if(IN.GetAction(IN.MOVE_LEFT))
	{
		Updater.m_Vel = -vRight*m_MovementSpeed;
		m_MovementKeyPressed = true;
	}
	
	if(Updater.m_Vel.magnitude != 0)
		transform.LookAt(transform.position + Updater.m_Vel);

}

function OnDestroy()
{
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		// Camera.main.GetComponent(CameraScript).m_ThirdPerson = true;
		// Camera.main.GetComponent(CameraScript).m_CamVel = Vector3(0,0,0);
		// Camera.main.GetComponent(CameraScript).m_CamPos = Vector3(transform.position.x, Camera.main.transform.position.y, transform.position.z) - transform.forward *200;
		// Camera.main.GetComponent(CameraScript).m_Offset = Vector3.forward *200;
		// Camera.main.transform.eulerAngles.z = 0;
	}	
}
