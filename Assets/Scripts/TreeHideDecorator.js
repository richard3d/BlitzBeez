#pragma strict
var m_Tree : GameObject = null;
private var m_FirstInput : boolean = true; //this component is added during a message that is sent and wil lbe processed asap on this component, so we use this variable to defer it
private var m_DisplaceVector : Vector3;
private var m_OrigPosition : Vector3; //original position of the character before they hid. We will put them this distance away


function Start () {

m_OrigPosition = transform.position;


}

function Update () {

	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	
	transform.position = (m_Tree.transform.position);//+ Vector3.up *10) ;
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
		RemoveTreeDecorator(m_DisplaceVector);
		networkView.RPC("RemoveTreeDecorator", RPCMode.Others,m_DisplaceVector);
	}
}

@RPC function RemoveTreeDecorator(vDisplacement : Vector3)
{
	m_DisplaceVector = vDisplacement;
	Debug.Log(m_Tree.name);
	Destroy(this);
}

function Hide(tree : GameObject)
{
	AudioSource.PlayClipAtPoint(GetComponent(BeeControllerScript).m_HideSound, Camera.main.transform.position);
	m_Tree = tree;
	collider.enabled = false;
	Debug.Log("Here "+tree.name);
	//gameObject.transform.position = tree.transform.position;
	
	if(GetComponentInChildren(ParticleRenderer) != null)
		GetComponentInChildren(ParticleRenderer).enabled = false;
	tree.transform.position.y = 1;
	
	gameObject.AddComponent(ControlDisablerDecorator);
	GetComponent(ControlDisablerDecorator).EnableNetworkInput(true);
}

function OnDestroy()
{
	AudioSource.PlayClipAtPoint(GetComponent(BeeControllerScript).m_HideSound, Camera.main.transform.position);

	
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
	GetComponent(UpdateScript).m_Vel = m_DisplaceVector * GetComponent(UpdateScript).m_MaxSpeed;
	
	gameObject.AddComponent(BeeDashDecorator);
	if(GetComponentInChildren(ParticleRenderer) != null)
		GetComponentInChildren(ParticleRenderer).enabled = true;
	
	Destroy(GetComponent(ControlDisablerDecorator));
	
}