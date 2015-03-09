#pragma strict
var m_Tree : GameObject = null;
private var m_FirstInput : boolean = true; //this component is added during a message that is sent and wil lbe processed asap on this component, so we use this variable to defer it
public var m_DisplaceVector : Vector3;
private var m_OrigPosition : Vector3; //original position of the character before they hid. We will put them this distance away
private var m_Camera:GameObject;

function Awake()
{
	m_Camera = GetComponent(BeeScript).m_Camera;
}

function Start () {

	Debug.Log("Starting");

	m_OrigPosition = transform.position;

	GetComponent(BeeControllerScript).m_ControlEnabled = false;
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
	
		//m_Flower.audio.Play();
		m_Camera.animation["CameraLessDramaticZoom"].speed = 1;
		m_Camera.animation.Play("CameraLessDramaticZoom");
	}
}

function Update () {

	if(m_Tree == null)
		return;
	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	
	transform.position = m_Tree.transform.position + Vector3.up *10;
	m_DisplaceVector = Vector3(0,0,0);
	
	
	//if we are hiding and the tree is burning (basically an animation is playing
	//then we need to hurt the bee
	if(m_Tree.animation.isPlaying && Network.isServer)
	{
		//RemoveTreeDecorator(m_DisplaceVector);
		//networkView.RPC("RemoveTreeDecorator", RPCMode.Others,m_DisplaceVector);
		
	}
	

}

function OnNetworkInput(IN : InputState)
{
	
	if(!networkView.isMine)
	{
		return;
	}
	
	if(m_FirstInput)
	{
		m_FirstInput = false;
		return;
	}
	

	
	if(IN.GetAction(IN.MOVE_UP))
	{
		m_DisplaceVector += transform.forward;
	}
	
	if(IN.GetAction(IN.MOVE_BACK))
	{
		m_DisplaceVector -= transform.forward;
	}
	
	if(IN.GetAction(IN.MOVE_RIGHT))
	{
		m_DisplaceVector += transform.right;
	}
	
	
	
	if(IN.GetAction(IN.MOVE_LEFT))
	{
		m_DisplaceVector -= transform.right;
	}
	
	if(IN.GetActionBuffered(IN.USE))
	{
	
		networkView.RPC("UnHideFromTree", RPCMode.All,m_DisplaceVector);
		//RemoveTreeDecorator(m_DisplaceVector);
		//networkView.RPC("RemoveTreeDecorator", RPCMode.Others,m_DisplaceVector);
	}
}

@RPC function RemoveTreeDecorator(vDisplacement : Vector3)
{
	m_DisplaceVector = vDisplacement;
	Debug.Log("Shouldnt be here"+m_Tree.name);
	Destroy(this);
}

function Hide(tree : GameObject)
{
	Debug.Log("Hiding");
	AudioSource.PlayClipAtPoint(GetComponent(BeeControllerScript).m_HideSound, m_Camera.transform.position);
	m_Tree = tree;
	collider.enabled = false;
	
	//gameObject.transform.position = tree.transform.position;
	
	if(GetComponentInChildren(ParticleRenderer) != null)
		GetComponentInChildren(ParticleRenderer).enabled = false;
	tree.transform.position.y = 1;
}

function OnDestroy()
{
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		m_Camera.animation["CameraLessDramaticZoom"].time = m_Camera.animation["CameraDramaticZoom"].length;
		m_Camera.animation["CameraLessDramaticZoom"].speed = -1;
		m_Camera.animation.Play("CameraLessDramaticZoom");
	}
	AudioSource.PlayClipAtPoint(GetComponent(BeeControllerScript).m_HideSound, m_Camera.transform.position);

	
	m_Tree.transform.position.y = 0;
	if(m_DisplaceVector.magnitude < 0.001)
		m_DisplaceVector = Vector3(0,0,-1);
	else
		m_DisplaceVector.Normalize();
	var pos : Vector3 = m_Tree.GetComponent(CapsuleCollider) == null ? m_Tree.GetComponent(BoxCollider).center : m_Tree.GetComponent(CapsuleCollider).center;
	pos.y = 0;
	var dist : float = m_Tree.GetComponent(CapsuleCollider) == null ? m_Tree.GetComponent(BoxCollider).size.x : m_Tree.GetComponent(CapsuleCollider).radius;
	transform.position = m_Tree.transform.position + m_DisplaceVector * (m_OrigPosition-m_Tree.transform.position).magnitude;
	transform.position.y = m_OrigPosition.y;
	collider.enabled = true;
	GetComponent(UpdateScript).m_Vel = m_DisplaceVector * GetComponent(UpdateScript).m_DefaultMaxSpeed;
	if(gameObject.GetComponent(BeeDashDecorator) == null)
		gameObject.AddComponent(BeeDashDecorator);
	if(GetComponentInChildren(ParticleRenderer) != null)
		GetComponentInChildren(ParticleRenderer).enabled = true;
	GetComponent(BeeControllerScript).m_ControlEnabled = true;
	//(GetComponent(ControlDisablerDecorator));
	
}