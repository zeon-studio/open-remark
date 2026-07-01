// app/dashboard/administration/page.tsx
import { PageHeader } from "@/components/dashboard/page-header"
import { PlatformUsersTable } from "@/components/dashboard/administration/platform-users-table"
import { UserSearchInput } from "@/components/dashboard/user-search-input"
import { listPlatformUsers } from "@/lib/services/platform-admin-service"

type Props = {
  searchParams: Promise<{ search?: string }>
}

export default async function AdministrationPage({ searchParams }: Props) {
  const { search } = await searchParams
  const users = await listPlatformUsers({ search })

  return (
    <div>
      <PageHeader
        title="Administration"
        description="All registered users on this instance"
        action={<UserSearchInput />}
      />
      <div className="p-6">
        <PlatformUsersTable users={users} />
      </div>
    </div>
  )
}
