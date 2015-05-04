#pragma strict
var m_Target : GameObject;
var m_CamPos : Vector3;
var m_CamVel : Vector3;
var m_CamDrag : float;

var m_Offset:Vector3 = Vector3(0,0,200);
var m_DefaultOffset:Vector3 = Vector3(0,-200,200);
var m_Pitch:float = 45;
var m_DefaultPitch:float = 45;

var m_ShakeStrength : float = 0;
var m_fShakeTimer : float = 0;
var m_fShakeTime : float = 0;


var m_Fixed : boolean = false;
var m_Freeze: boolean = false;
var m_TerrainLayer:LayerMask; //for collision

//helper variables
private var m_YRot:float = 0;
private var m_CurrPitch:float = 45;
private var m_CurrOffset:Vector3 = Vector3(0,0,200);

function Start () {

	m_CurrPitch = m_Pitch;
	m_CamPos = transform.position;
	// if(Network.isServer)
	// {
		// var server : ServerScript = GameObject.Find("GameServer").GetComponent(ServerScript) as ServerScript;
		
			
		
	// }
}

function Update () {

	if(Network.isClient)
	{
		var client : ClientScript = GameObject.Find("GameClient").GetComponent(ClientScript) as ClientScript;
		m_Target = client.GetClient(client.m_ClientID).m_GameObject;
	}
	else if(Network.isServer)
	{
		//m_Target = gameObject.Find("Bee0");
	}
	
	if(!m_Target || m_Freeze)
		return;
	if(GetComponent(Camera).orthographic)
	{
		if(m_CamVel.magnitude - m_CamDrag * Time.deltaTime <= 0)
				m_CamVel = Vector3(0,0,0);
			else
				m_CamVel -= m_CamVel.normalized * m_CamDrag* Time.deltaTime;
				
		//m_CamVel += m_CamAccel* Time.deltaTime;
		Camera.main.orthographicSize += m_CamVel.y * Time.deltaTime;
		var camVel = Vector3(m_CamVel.x, 0, m_CamVel.z);
		m_CamPos += camVel * Time.deltaTime;
		transform.position = m_CamPos;
		
		
	}
	else
	{
		
		//Let cast 5 rays
		var rays:Vector3[] = new Vector3[5];
		var ScreenPts:Vector3[] = new Vector3[5];
		ScreenPts[0] = Vector3(0,0,camera.nearClipPlane);
		ScreenPts[1] = Vector3(Screen.width,0,camera.nearClipPlane);
		ScreenPts[2] = Vector3(Screen.width,Screen.height,camera.nearClipPlane);
		ScreenPts[3] = Vector3(0,Screen.height,camera.nearClipPlane);
		ScreenPts[4] = Vector3(Screen.width*0.5,Screen.height*0.5,camera.nearClipPlane);
		
		for(var i:int = 0; i < 5; i++)
		{
			rays[i] = camera.ScreenToWorldPoint(ScreenPts[i]); 
		}
		
		rays[0] = rays[0] - rays[4];
		rays[1] = rays[1] - rays[4];
		rays[2] = rays[2] - rays[4];
		rays[3] = rays[3] - rays[4];
		
		
		var dist:float = 99999;
		var point:Vector3;
		for(i = 0; i < 4; i++)
		{
			rays[i] = m_Target.transform.position +Vector3.up*6 + rays[i]; 
			//rays[i] = rays[i] + transform.forward * m_CurrOffset.magnitude;
			var r:RaycastHit;
			//Physics.Raycast(rays[i], -transform.forward, r);
			//Debug.DrawRay(rays[i], -transform.forward*999, Color.red);
			if(Physics.Raycast(rays[i], -transform.forward, r, Mathf.Infinity, m_TerrainLayer))
			{
				if(r.distance < dist)
				{
					dist = r.distance;
					point = r.point;
				}
			}
			
		}
		
		if(point != Vector3.zero)
		{
		
			//gameObject.Find("Rock1").transform.position = point;
			 //Debug.Log(point);
		    
			if(dist < 20)
			  dist = 20;
			 //Debug.Log(dist);
			 
			// Debug.DrawLine(point,m_Target.transform.position);
			 var tempOffset = point - m_Target.transform.position;
			 var tempY = tempOffset.y;
			 tempOffset.y = 0;
			 m_Offset.z = -tempOffset.magnitude;
			 m_Offset.y = tempY;
			 
			// m_Offset = point - transform.position;
			 
			if(m_Offset.magnitude < 20)
				m_Offset = m_Offset.normalized * 20;
			
		}
		else
		{
			//m_Pitch = m_DefaultPitch;
			if(m_Target.GetComponent(HammerDecorator) == null)
				m_Offset = m_DefaultOffset;
		}
		
		
		
		
		m_CurrOffset = Vector3.Lerp(m_CurrOffset, m_Offset, Time.deltaTime*5);
		
		m_CamVel = m_Target.transform.position-m_CamPos;
		m_CamPos += m_CamVel * Time.deltaTime*4;
		
		//New Shit
		var m_WorldOffset:Vector3 = (m_CurrOffset.x*Vector3.right+m_CurrOffset.y*Vector3.up+m_CurrOffset.z*Vector3.forward);
		
		var desiredRot = m_Target.transform.localEulerAngles.y;

		
		if(desiredRot - m_YRot < -180)
				m_YRot -= 360;
		else if (desiredRot - m_YRot > 180)
			m_YRot += 360;
		if(!m_Fixed)
			m_YRot = Mathf.Lerp(m_YRot, desiredRot, Time.deltaTime*5);
		m_WorldOffset = Quaternion.AngleAxis(m_YRot, Vector3.up) * m_WorldOffset ;
		var m_CamWorldPos:Vector3 = m_CamPos + m_WorldOffset;
		
		
		if(m_fShakeTime > 0)
		{
			
			var ShakeOffset : Vector3 = Random.Range(-1, 1) * transform.up + Random.Range(-1, 1) * transform.right;
			ShakeOffset = ShakeOffset.normalized *m_ShakeStrength;
			m_fShakeTime -= Time.deltaTime;
			transform.position = m_CamWorldPos +  ShakeOffset;
			transform.LookAt(m_CamPos + ShakeOffset);
		}
		else
		{
			m_ShakeStrength = 0.0;
			//GetComponent(CharacterController).Move(m_CamWorldPos -transform.position);
			transform.position = m_CamWorldPos;
			transform.LookAt(m_CamPos);
			
		}
		
		m_CurrPitch = Mathf.Lerp(m_CurrPitch, m_Pitch, Time.deltaTime *5);
		transform.localEulerAngles.x = m_CurrPitch;
		
	}
}

//sets the camera to its offsets immediately rather than interpolate to them
function SnapToOffset()
{
	var m_WorldOffset:Vector3 = (m_Offset.x*Vector3.right+m_Offset.y*Vector3.up+m_Offset.z*Vector3.forward);
	//m_CurrOffset = m_WorldOffset;
	var desiredRot = m_Target.transform.localEulerAngles.y;
	m_YRot = desiredRot;
	m_WorldOffset = Quaternion.AngleAxis(desiredRot, Vector3.up) * m_CurrOffset;
	var m_CamWorldPos:Vector3 = m_CamPos + m_WorldOffset;
	transform.position = m_CamWorldPos;
	transform.LookAt(m_CamPos);
	transform.localEulerAngles.x = m_Pitch;
}

function Shake(time : float , strength : float)
{	
    m_ShakeStrength = strength;
	m_fShakeTime = time;
}

function OnPostRender()
{
	var guis:GameObject[] = gameObject.FindGameObjectsWithTag("GUI");
	for(var gui:GameObject in guis)
	{
		gui.GetComponent(BillboardScript).Draw();
	}
}

function SetFocalPosition(pos:Vector3)
{
	var myPos:Vector3 = pos;
	myPos.y = 0;
	var camPos:Vector3 = Camera.main.transform.position;
	camPos.y = 0;
	
	Debug.Log("focpos");
	if(m_Target != null)
	{
		m_CamPos +=  (myPos-camPos) - (m_Offset.x*m_Target.transform.right+m_Offset.y*m_Target.transform.up+m_Offset.z*m_Target.transform.forward);
	}
	
	
}