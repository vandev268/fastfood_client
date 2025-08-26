import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useEffect } from 'react'
import { handleError } from '@/lib/utils'
import { toast } from 'sonner'
import { UpdateRoleBodySchema, type UpdateRoleBodyType } from '@/schemaValidations/role.schema'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import type { PermissionType } from '@/schemaValidations/permission.schema'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useAllPermissionsQuery } from '@/queries/usePermission'
import { useRoleDetailQuery, useUpdateRoleMutation } from '@/queries/useRole'
import { formatRoleStatusText } from '@/lib/format'
import TinyEditor from '@/components/TinyEditor'

export default function EditRole({
  id,
  setId,
  onSuccess
}: {
  id?: number | undefined
  setId: (value: number | undefined) => void
  onSuccess?: () => void
}) {
  const form = useForm<UpdateRoleBodyType>({
    resolver: zodResolver(UpdateRoleBodySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      permissionIds: []
    }
  })

  const reset = () => {
    setId(undefined)
    form.reset()
  }

  const permissionsQuery = useAllPermissionsQuery()
  const permissions = permissionsQuery.data?.data.data || []
  const groupedPermissionsByModule = permissions.reduce<Record<string, PermissionType[]>>((acc, cur) => {
    ;(acc[cur.module] ??= []).push(cur)
    return acc
  }, {})
  const permissionsKeys = Object.keys(groupedPermissionsByModule).filter((key) => key !== '')
  const roleDetailQuery = useRoleDetailQuery(id)
  useEffect(() => {
    if (roleDetailQuery.data) {
      const { name, description, isActive, permissions } = roleDetailQuery.data.data
      form.reset({
        name,
        description,
        isActive,
        permissionIds: permissions.map((permission) => permission.id)
      })
    }
  }, [roleDetailQuery.data, form])

  const updateRoleMutation = useUpdateRoleMutation()
  const onSubmit = async (body: UpdateRoleBodyType) => {
    if (updateRoleMutation.isPending) return
    try {
      const payload = {
        roleId: id as number,
        body
      }
      await updateRoleMutation.mutateAsync(payload)
      reset()
      toast.success('Cập nhật vai trò và quyền hạn thành công')
    } catch (error) {
      handleError(error, form.setError)
      reset()
    }
  }

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) {
          reset()
        }
      }}
    >
      <DialogContent className='sm:max-w-[750px] max-h-screen overflow-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Cập nhật vai trò và quyền hạn</DialogTitle>
          <DialogDescription>
            Các trường sau đây là bắt buộc: Tên vai trò, trạng thái, danh sách quyền hạn
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            className='grid auto-rows-max items-start gap-4 md:gap-8'
            id='edit-role-form'
            onSubmit={form.handleSubmit(onSubmit, (error) => {
              console.log(error)
            })}
          >
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='name'>Tên vai trò</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <Input
                          id='name'
                          className='w-full bg-gray-100'
                          {...field}
                          readOnly
                          placeholder='Tên vai trò...'
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='isActive'>Trạng thái</Label>
                      <div className='col-span-3 w-full space-y-2'>
                        <RadioGroup
                          defaultValue={field.value ? 'active' : 'inactive'}
                          onValueChange={(e) => {
                            const val = e === 'active' ? true : false
                            field.onChange(val)
                          }}
                          value={field.value ? 'active' : 'inactive'}
                        >
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='active' id='active' />
                            <Label htmlFor='active'>{formatRoleStatusText(true)}</Label>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem value='inactive' id='inactive' />
                            <Label htmlFor='inactive'>{formatRoleStatusText(false)}</Label>
                          </div>
                        </RadioGroup>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='description'>Mô tả</Label>
                      <div className='col-span-3 w-full space-y-2 '>
                        <TinyEditor value={field.value} onChange={field.onChange} h={250} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <Separator />
              <FormField
                control={form.control}
                name='permissionIds'
                render={({ field }) => (
                  <FormItem>
                    <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                      <Label htmlFor='permissionIds'>Danh sách quyền hạn</Label>
                      <div className='col-span-3 w-full space-y-2 '>
                        <Accordion type='single' collapsible className='w-full' defaultValue={permissionsKeys[0]}>
                          {permissionsKeys.map((key) => {
                            const modulePermissionIds = groupedPermissionsByModule[key].map((p) => p.id)
                            const allChecked = modulePermissionIds.every((id) => field.value?.includes(id))
                            const someChecked =
                              modulePermissionIds.some((id) => field.value?.includes(id)) && !allChecked

                            return (
                              <AccordionItem key={key} value={key}>
                                <div className='flex items-center'>
                                  <Checkbox
                                    className='ml-2 mr-2'
                                    checked={allChecked}
                                    data-state={someChecked ? 'indeterminate' : allChecked ? 'checked' : 'unchecked'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        // Add all module permissions
                                        const newValue = [...new Set([...field.value, ...modulePermissionIds])]
                                        field.onChange(newValue)
                                      } else {
                                        // Remove all module permissions
                                        field.onChange(
                                          field.value?.filter((value) => !modulePermissionIds.includes(value))
                                        )
                                      }
                                    }}
                                  />
                                  <AccordionTrigger className='capitalize flex-grow'>
                                    {key.toLowerCase()}
                                  </AccordionTrigger>
                                </div>
                                <AccordionContent className='flex flex-col gap-4 text-balance'>
                                  {groupedPermissionsByModule[key].map((permission) => {
                                    return (
                                      <FormItem key={permission.id} className='flex flex-row items-center gap-2'>
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(permission.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, permission.id])
                                                : field.onChange(
                                                    field.value?.filter((value) => value !== permission.id)
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className='text-sm font-normal'>{permission.name}</FormLabel>
                                      </FormItem>
                                    )
                                  })}
                                </AccordionContent>
                              </AccordionItem>
                            )
                          })}

                          <FormMessage />
                        </Accordion>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='edit-role-form'>
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
