#pragma strict
var m_Tree : GameObject = null;
private var m_FirstInput : boolean = true; //this component is added during a message that is sent and wil lbe processed asap on this component, so we use this variable to defer it
private var m_DisplaceVector : Vector3;


function Start () {



}

function Update () {

	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	transform.position += (m_Tree.transform.position-transform.position + Vector3.up *10) * Time.deltaTime * 20 ;
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
		m_DisplaceVector += Vector3.forward;
	}
	
	if(IN.GetAction(IN.MOVE_BACK))
	{
		m_DisplaceVector -= Vector3.forward;
	}
	
	if(IN.GetAction(IN.MOVE_RIGHT))
	{
		m_DisplaceVector += Vector3.right;
	}
	
	
	
	if(IN.GetAction(IN.MOVE_LEFT))
	{
		m_DisplaceVector -= Vector3.right;
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
	
	Destroy(this);
}

function Hide(tree : GameObject)
{
	AudioSource.PlayClipAtPoint(GetComponent(BeeControllerScript).m_HideSound, Camera.main.transform.position);
	m_Tree = tree;
	collider.enabled = false;
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
	collider.enabled = true;
	
	m_Tree.transform.position.y = 0;
	if(m_DisplaceVector.magnitude < 0.001)
		m_DisplaceVector = Vector3(0,0,-1);
	else
		m_DisplaceVector.Normalize();
	var pos : Vector3 = m_Tree.GetComponent(CapsuleCollider) == null ? m_Tree.GetComponent(BoxCollider).center : m_Tree.GetComponent(CapsuleCollider).center;
	pos.y = 0;
	var dist : float = m_Tree.GetComponent(CapsuleCollider) == null ? m_Tree.GetComponent(BoxCollider).size.x : m_Tree.GetComponent(CapsuleCollider).radius;
	transform.position = m_Tree.transform.position + Vector3.Scale(pos, m_Tree.transform.localScale)  + m_DisplaceVector *1.05* (transform.localScale.x * GetComponent(SphereCollider).radius + m_Tree.transform.localScale.x * dist);
	
	GetComponent(UpdateScript).m_Vel = m_DisplaceVector * GetComponent(UpdateScript).m_MaxSpeed;
	gameObject.AddComponent(BeeDashDecorator);
	if(GetComponentInChildren(ParticleRenderer) != null)
		GetComponentInChildren(ParticleRenderer).enabled = true;
	
	Destroy(GetComponent(ControlDisablerDecorator));
	
}